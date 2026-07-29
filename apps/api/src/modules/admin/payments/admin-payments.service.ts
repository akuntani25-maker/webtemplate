import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notifications/notification.service';
import { TypedConfigService } from '../../../config/typed-config.service';
import { paginated, PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * Tahap 8 — Verifikasi pembayaran manual oleh admin.
 *
 * Approve: proof APPROVED → invoice PAID → order PAID → buat License per item
 * (kuota download) → naikkan purchaseCount → email "download tersedia".
 * Semua dalam satu transaksi agar konsisten.
 */
@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
    private readonly config: TypedConfigService,
  ) {}

  async list(query: PaginationDto & { status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PaymentProofWhereInput = query.status
      ? { status: query.status as never }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.db.paymentProof.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          invoice: {
            include: {
              order: {
                select: {
                  number: true,
                  grandTotal: true,
                  customerName: true,
                  customerEmail: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.db.paymentProof.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async approve(proofId: string, adminId: string) {
    const proof = await this.prisma.db.paymentProof.findUnique({
      where: { id: proofId },
      include: {
        invoice: { include: { order: { include: { items: true } } } },
      },
    });
    if (!proof) throw new NotFoundException('Bukti pembayaran tidak ditemukan');
    if (proof.status === 'APPROVED') {
      throw new BadRequestException('Bukti ini sudah disetujui');
    }

    const invoice = proof.invoice;
    const order = invoice.order;
    const maxDownloads = this.config.get('DOWNLOAD_MAX_PER_LICENSE');
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: { id: proofId },
        data: {
          status: 'APPROVED',
          reviewedById: adminId,
          reviewedAt: now,
        },
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID', paidAt: now },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: now },
      });

      // Buat License per item (idempoten: lewati bila sudah ada)
      for (const item of order.items) {
        const existing = await tx.license.findUnique({
          where: { orderItemId: item.id },
        });
        if (!existing) {
          await tx.license.create({
            data: {
              orderItemId: item.id,
              orderId: order.id,
              userId: order.userId,
              productId: item.productId,
              maxDownloads,
            },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { purchaseCount: { increment: item.quantity } },
        });
      }

      // Tandai pemakaian kupon
      if (order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
    });

    await this.audit.log({
      userId: adminId,
      action: 'PAYMENT_APPROVED',
      entity: 'Order',
      entityId: order.id,
    });
    await this.notifications.paymentApproved(order.customerEmail, order.number);

    return { data: { orderId: order.id, status: 'PAID' } };
  }

  async reject(proofId: string, adminId: string, reason: string) {
    const proof = await this.prisma.db.paymentProof.findUnique({
      where: { id: proofId },
      include: { invoice: { include: { order: true } } },
    });
    if (!proof) throw new NotFoundException('Bukti pembayaran tidak ditemukan');

    await this.prisma.db.paymentProof.update({
      where: { id: proofId },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
    });

    await this.audit.log({
      userId: adminId,
      action: 'PAYMENT_REJECTED',
      entity: 'Invoice',
      entityId: proof.invoiceId,
      metadata: { reason },
    });
    await this.notifications.paymentRejected(
      proof.invoice.order.customerEmail,
      proof.invoice.order.number,
      reason,
    );

    return { data: { proofId, status: 'REJECTED' } };
  }
}

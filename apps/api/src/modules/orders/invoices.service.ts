import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../media/storage.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/audit.service';
import { slugify } from '../../common/utils/slug.util';

export interface UploadProofDto {
  storageKey: string;
  senderName?: string;
  senderBank?: string;
  amount?: number;
  transferredAt?: string;
  note?: string;
}

/**
 * Tahap 7 — Invoice & upload bukti transfer.
 */
@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  private async getOwnedInvoice(userId: string, number: string) {
    const invoice = await this.prisma.db.invoice.findUnique({
      where: { number },
      include: { order: true },
    });
    if (!invoice || invoice.order.userId !== userId) {
      throw new NotFoundException('Invoice tidak ditemukan');
    }
    return invoice;
  }

  async detail(userId: string, number: string) {
    const invoice = await this.prisma.db.invoice.findUnique({
      where: { number },
      include: {
        order: {
          include: { items: true, user: { select: { id: true } } },
        },
        proofs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice || invoice.order.userId !== userId) {
      throw new NotFoundException('Invoice tidak ditemukan');
    }
    return { data: invoice };
  }

  /** Presigned PUT untuk mengunggah bukti transfer ke R2 (privat). */
  async presignProof(
    userId: string,
    number: string,
    fileName: string,
    contentType: string,
  ) {
    const invoice = await this.getOwnedInvoice(userId, number);
    const key = `proofs/${invoice.id}/${Date.now()}-${slugify(fileName)}`;
    const { url } = await this.storage.getUploadUrl(key, contentType);
    return { data: { uploadUrl: url, storageKey: key } };
  }

  /** Catat bukti transfer → PaymentProof PENDING. */
  async submitProof(userId: string, number: string, dto: UploadProofDto) {
    const invoice = await this.getOwnedInvoice(userId, number);

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice ini sudah dibayar');
    }
    if (invoice.status === 'EXPIRED') {
      throw new BadRequestException('Invoice sudah kedaluwarsa');
    }

    const proof = await this.prisma.db.paymentProof.create({
      data: {
        invoiceId: invoice.id,
        storageKey: dto.storageKey,
        senderName: dto.senderName,
        senderBank: dto.senderBank,
        amount: dto.amount,
        transferredAt: dto.transferredAt
          ? new Date(dto.transferredAt)
          : undefined,
        note: dto.note,
        status: 'PENDING',
      },
    });

    await this.audit.log({
      userId,
      action: 'PROOF_UPLOADED',
      entity: 'Invoice',
      entityId: invoice.id,
    });
    await this.notifications.proofReceived(
      invoice.order.customerEmail,
      invoice.order.number,
    );

    return { data: proof };
  }
}

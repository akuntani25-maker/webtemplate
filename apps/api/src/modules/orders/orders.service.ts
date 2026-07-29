import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import type { Coupon } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CouponsService } from './coupons.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/audit.service';
import { TypedConfigService } from '../../config/typed-config.service';
import type { CheckoutDto } from './dto/checkout.dto';

const suffix = customAlphabet('0123456789', 5);

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coupons: CouponsService,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
    private readonly config: TypedConfigService,
  ) {}

  private orderNumber(): string {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}${String(d.getDate()).padStart(2, '0')}`;
    return `INV-${ymd}-${suffix()}`;
  }

  private async paymentInstructions() {
    const setting = await this.prisma.db.siteSetting.findUnique({
      where: { key: 'payment.bank' },
    });
    if (setting) return setting.value;
    return {
      bankName: this.config.get('BANK_NAME'),
      accountNumber: this.config.get('BANK_ACCOUNT_NUMBER'),
      accountHolder: this.config.get('BANK_ACCOUNT_HOLDER'),
    };
  }

  /**
   * Tahap 6 — Checkout. Membuat Order + OrderItem + Invoice (WAITING_PAYMENT).
   * Harga item memakai discountPrice bila ada; total dihitung server-side (BR-5).
   */
  async checkout(userId: string, dto: CheckoutDto) {
    // Ambil produk yang valid & published
    const ids = dto.items.map((i) => i.productId);
    const products = await this.prisma.db.product.findMany({
      where: { id: { in: ids }, status: 'PUBLISHED' },
    });
    if (products.length !== ids.length) {
      throw new BadRequestException(
        'Sebagian produk tidak tersedia atau tidak dipublikasikan',
      );
    }

    // Hitung item & subtotal (harga otoritatif dari DB)
    const items = dto.items.map((it) => {
      const product = products.find((p) => p.id === it.productId)!;
      const unitPrice = product.discountPrice ?? product.price;
      const quantity = it.quantity ?? 1;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
      };
    });
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

    // Kupon (opsional)
    let discountTotal = 0;
    let coupon: Coupon | null = null;
    if (dto.couponCode) {
      const result = await this.coupons.validate(dto.couponCode, subtotal);
      coupon = result.coupon;
      discountTotal = result.discount;
    }

    const grandTotal = Math.max(0, subtotal - discountTotal);
    const expiryHours = this.config.get('INVOICE_EXPIRY_HOURS');
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);
    const number = this.orderNumber();
    const instructions = await this.paymentInstructions();

    const order = await this.prisma.db.order.create({
      data: {
        number,
        userId,
        status: 'WAITING_PAYMENT',
        subtotal,
        discountTotal,
        grandTotal,
        couponId: coupon?.id,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail.toLowerCase(),
        notes: dto.notes,
        items: { create: items },
        invoice: {
          create: {
            number: `PAY-${number.slice(4)}`,
            paymentMethod: dto.paymentMethod,
            status: 'WAITING_PAYMENT',
            amount: grandTotal,
            paymentInstructions: instructions as never,
            expiresAt,
          },
        },
      },
      include: { items: true, invoice: true },
    });

    await this.audit.log({
      userId,
      action: 'ORDER_CREATED',
      entity: 'Order',
      entityId: order.id,
    });
    await this.notifications.checkoutCreated(
      order.customerEmail,
      order.number,
      grandTotal,
    );

    return { data: order };
  }

  async myOrders(userId: string) {
    const orders = await this.prisma.db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: { select: { status: true, expiresAt: true } },
        _count: { select: { items: true } },
      },
    });
    return { data: orders };
  }

  async myOrderDetail(userId: string, number: string) {
    const order = await this.prisma.db.order.findFirst({
      where: { number, userId },
      include: {
        items: true,
        invoice: { include: { proofs: true } },
        licenses: { include: { product: { select: { name: true, slug: true } } } },
        coupon: { select: { code: true, type: true, value: true } },
      },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return { data: order };
  }
}

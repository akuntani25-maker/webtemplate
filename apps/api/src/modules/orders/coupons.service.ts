import { BadRequestException, Injectable } from '@nestjs/common';
import type { Coupon } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface CouponResult {
  coupon: Coupon;
  discount: number;
}

/**
 * Validasi & perhitungan diskon kupon (dipakai checkout dan endpoint validate).
 */
@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Hitung potongan; lempar BadRequest bila kupon tidak berlaku. */
  async validate(code: string, subtotal: number): Promise<CouponResult> {
    const coupon = await this.prisma.db.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Kupon tidak ditemukan atau tidak aktif');
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('Kupon belum berlaku');
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException('Kupon sudah kedaluwarsa');
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Kuota kupon telah habis');
    }
    if (subtotal < coupon.minPurchase) {
      throw new BadRequestException(
        `Minimal pembelian Rp ${coupon.minPurchase.toLocaleString('id-ID')}`,
      );
    }

    let discount =
      coupon.type === 'PERCENT'
        ? Math.floor((subtotal * coupon.value) / 100)
        : coupon.value;

    if (coupon.type === 'PERCENT' && coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    // Potongan tak boleh melebihi subtotal (BR-5)
    discount = Math.min(discount, subtotal);

    return { coupon, discount };
  }
}

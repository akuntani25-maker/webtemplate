import { BadRequestException } from '@nestjs/common';
import { CouponsService } from './coupons.service';

function prismaWith(coupon: any) {
  return {
    db: { coupon: { findUnique: jest.fn(async () => coupon) } },
  } as any;
}

const base = {
  id: 'c1',
  code: 'HEMAT20',
  isActive: true,
  minPurchase: 0,
  maxDiscount: null,
  usageLimit: null,
  usedCount: 0,
  startsAt: null,
  expiresAt: null,
};

describe('CouponsService.validate', () => {
  it('menghitung diskon persen', async () => {
    const svc = new CouponsService(
      prismaWith({ ...base, type: 'PERCENT', value: 20 }),
    );
    const { discount } = await svc.validate('HEMAT20', 100_000);
    expect(discount).toBe(20_000);
  });

  it('membatasi diskon persen dengan maxDiscount', async () => {
    const svc = new CouponsService(
      prismaWith({ ...base, type: 'PERCENT', value: 50, maxDiscount: 30_000 }),
    );
    const { discount } = await svc.validate('HEMAT20', 100_000);
    expect(discount).toBe(30_000);
  });

  it('diskon nominal tidak melebihi subtotal (BR-5)', async () => {
    const svc = new CouponsService(
      prismaWith({ ...base, type: 'FIXED', value: 200_000 }),
    );
    const { discount } = await svc.validate('HEMAT20', 50_000);
    expect(discount).toBe(50_000);
  });

  it('menolak bila di bawah minimal pembelian', async () => {
    const svc = new CouponsService(
      prismaWith({ ...base, type: 'FIXED', value: 10_000, minPurchase: 100_000 }),
    );
    await expect(svc.validate('HEMAT20', 50_000)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('menolak kupon kedaluwarsa', async () => {
    const svc = new CouponsService(
      prismaWith({
        ...base,
        type: 'PERCENT',
        value: 10,
        expiresAt: new Date(Date.now() - 1000),
      }),
    );
    await expect(svc.validate('HEMAT20', 100_000)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

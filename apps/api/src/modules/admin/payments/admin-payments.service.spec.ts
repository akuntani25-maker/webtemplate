import { AdminPaymentsService } from './admin-payments.service';

/**
 * Memverifikasi logika inti verifikasi pembayaran:
 * approve → order PAID + License dibuat per item.
 */
describe('AdminPaymentsService.approve', () => {
  const order = {
    id: 'o1',
    number: 'INV-1',
    userId: 'u1',
    couponId: null,
    customerEmail: 'buyer@x.com',
    items: [
      { id: 'oi1', productId: 'p1', quantity: 1 },
      { id: 'oi2', productId: 'p2', quantity: 2 },
    ],
  };

  function buildPrisma() {
    const licensesCreated: any[] = [];
    const productUpdates: any[] = [];
    const tx = {
      paymentProof: { update: jest.fn() },
      invoice: { update: jest.fn() },
      order: { update: jest.fn() },
      license: {
        findUnique: jest.fn(async () => null),
        create: jest.fn(async ({ data }: any) => {
          licensesCreated.push(data);
          return data;
        }),
      },
      product: {
        update: jest.fn(async (arg: any) => {
          productUpdates.push(arg);
        }),
      },
      coupon: { update: jest.fn() },
    };
    const prisma = {
      db: {
        paymentProof: {
          findUnique: jest.fn(async () => ({
            id: 'pp1',
            status: 'PENDING',
            invoiceId: 'i1',
            invoice: { id: 'i1', order },
          })),
        },
      },
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    };
    return { prisma, tx, licensesCreated, productUpdates };
  }

  it('membuat License untuk tiap item dan menandai order PAID', async () => {
    const { prisma, tx, licensesCreated, productUpdates } = buildPrisma();
    const audit = { log: jest.fn() } as any;
    const notifications = { paymentApproved: jest.fn() } as any;
    const config = { get: () => 5 } as any;

    const svc = new AdminPaymentsService(
      prisma as any,
      audit,
      notifications,
      config,
    );
    const res = await svc.approve('pp1', 'admin1');

    expect(res.data.status).toBe('PAID');
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PAID' }) }),
    );
    expect(licensesCreated).toHaveLength(2);
    expect(licensesCreated[0]).toMatchObject({
      productId: 'p1',
      userId: 'u1',
      maxDownloads: 5,
    });
    // purchaseCount dinaikkan per item (increment sesuai quantity)
    expect(productUpdates).toHaveLength(2);
    expect(notifications.paymentApproved).toHaveBeenCalledWith(
      'buyer@x.com',
      'INV-1',
    );
  });
});

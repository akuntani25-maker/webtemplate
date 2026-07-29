import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Kartu ringkasan dashboard. */
  async overview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      revenueAgg,
      monthRevenueAgg,
      paidOrders,
      pendingPayments,
      totalUsers,
      newUsersMonth,
      totalProducts,
      totalDownloads,
    ] = await Promise.all([
      this.prisma.db.order.aggregate({
        _sum: { grandTotal: true },
        where: { status: 'PAID' },
      }),
      this.prisma.db.order.aggregate({
        _sum: { grandTotal: true },
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
      }),
      this.prisma.db.order.count({ where: { status: 'PAID' } }),
      this.prisma.db.paymentProof.count({ where: { status: 'PENDING' } }),
      this.prisma.db.user.count(),
      this.prisma.db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.db.product.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.db.downloadLog.count(),
    ]);

    return {
      data: {
        revenueTotal: revenueAgg._sum.grandTotal ?? 0,
        revenueThisMonth: monthRevenueAgg._sum.grandTotal ?? 0,
        paidOrders,
        pendingPayments,
        totalUsers,
        newUsersThisMonth: newUsersMonth,
        publishedProducts: totalProducts,
        totalDownloads,
      },
    };
  }

  /** Grafik penjualan harian untuk N hari terakhir. */
  async sales(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.$queryRaw<
      { date: Date; revenue: bigint | number; orders: bigint | number }[]
    >(
      Prisma.sql`
        SELECT date_trunc('day', "paidAt") AS date,
               COALESCE(SUM("grandTotal"), 0) AS revenue,
               COUNT(*) AS orders
        FROM "orders"
        WHERE "status" = 'PAID' AND "paidAt" >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    );

    const data: SalesPoint[] = rows.map((r) => ({
      date: new Date(r.date).toISOString().slice(0, 10),
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));

    return { data };
  }

  /** Produk terlaris berdasarkan jumlah pembelian. */
  async topProducts(limit = 10) {
    const items = await this.prisma.db.product.findMany({
      orderBy: { purchaseCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        purchaseCount: true,
        downloadCount: true,
        price: true,
        ratingAvg: true,
      },
    });
    return { data: items };
  }

  /** Statistik download harian. */
  async downloads(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.$queryRaw<
      { date: Date; count: bigint | number }[]
    >(
      Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS date, COUNT(*) AS count
        FROM "download_logs"
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    );

    const data = rows.map((r) => ({
      date: new Date(r.date).toISOString().slice(0, 10),
      count: Number(r.count),
    }));
    return { data };
  }
}

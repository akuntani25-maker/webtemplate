import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

/**
 * BR-1 — Invoice WAITING_PAYMENT yang melewati batas waktu otomatis EXPIRED.
 * Berjalan tiap 15 menit.
 */
@Injectable()
export class InvoiceExpiryJob {
  private readonly logger = new Logger(InvoiceExpiryJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handle(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.db.invoice.findMany({
      where: { status: 'WAITING_PAYMENT', expiresAt: { lt: now } },
      select: { id: true, orderId: true },
    });
    if (expired.length === 0) return;

    await this.prisma.$transaction([
      this.prisma.invoice.updateMany({
        where: { id: { in: expired.map((e) => e.id) } },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.order.updateMany({
        where: { id: { in: expired.map((e) => e.orderId) } },
        data: { status: 'EXPIRED' },
      }),
    ]);

    this.logger.log(`${expired.length} invoice ditandai EXPIRED`);
  }
}

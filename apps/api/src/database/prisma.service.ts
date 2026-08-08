import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './soft-delete.extension';

/**
 * PrismaService membungkus PrismaClient + soft-delete extension.
 *
 * Karena `$extends` mengembalikan client baru (immutable), kita simpan hasil
 * ekstensi di `this.db` dan mendelegasikan akses model melalui Proxy sehingga
 * pemakaian tetap `prisma.user.findMany(...)`.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  /** Client yang sudah di-extend (soft delete aktif). */
  public readonly db: ReturnType<typeof softDeleteExtension>;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    this.db = softDeleteExtension(this);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

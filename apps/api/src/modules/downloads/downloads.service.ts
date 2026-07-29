import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../media/storage.service';
import { AuditService } from '../audit/audit.service';

/**
 * Tahap 9 — Download produk digital yang aman.
 *
 * Aturan (FR-D, BR-2, BR-3):
 *  - Hanya pemilik License aktif yang bisa mengunduh.
 *  - Signed URL berumur pendek (default 10 menit) — di-generate on demand.
 *  - Maksimal 5x download per license (kuota).
 *  - Setiap download dicatat (DownloadLog + audit).
 */
@Injectable()
export class DownloadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /** Daftar file yang tersedia untuk sebuah license milik user. */
  async listFiles(userId: string, licenseId: string) {
    const license = await this.getOwnedLicense(userId, licenseId);
    const files = await this.prisma.db.productFile.findMany({
      where: { productId: license.productId },
      select: {
        id: true,
        label: true,
        fileName: true,
        format: true,
        sizeBytes: true,
        version: true,
      },
    });
    return {
      data: {
        license: {
          id: license.id,
          downloadCount: license.downloadCount,
          maxDownloads: license.maxDownloads,
          remaining: Math.max(0, license.maxDownloads - license.downloadCount),
        },
        files,
      },
    };
  }

  /** Terbitkan signed URL sekali pakai untuk satu file. */
  async sign(
    userId: string,
    licenseId: string,
    fileId: string,
    ctx: { ip?: string; userAgent?: string },
  ) {
    const license = await this.getOwnedLicense(userId, licenseId);

    if (!license.active) {
      throw new ForbiddenException('Lisensi tidak aktif');
    }
    if (license.downloadCount >= license.maxDownloads) {
      throw new ForbiddenException(
        'Kuota download habis. Hubungi admin bila perlu.',
      );
    }

    const file = await this.prisma.db.productFile.findFirst({
      where: { id: fileId, productId: license.productId },
    });
    if (!file) throw new NotFoundException('File tidak ditemukan');

    const { url, expiresAt } = await this.storage.getDownloadUrl(
      file.storageKey,
      file.fileName,
    );

    // Increment kuota + catat log secara atomik
    await this.prisma.$transaction([
      this.prisma.license.update({
        where: { id: license.id },
        data: { downloadCount: { increment: 1 } },
      }),
      this.prisma.product.update({
        where: { id: license.productId },
        data: { downloadCount: { increment: 1 } },
      }),
      this.prisma.downloadLog.create({
        data: {
          licenseId: license.id,
          productFileId: file.id,
          userId,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        },
      }),
    ]);

    await this.audit.log({
      userId,
      action: 'DOWNLOAD',
      entity: 'ProductFile',
      entityId: file.id,
      ...ctx,
    });

    return {
      data: {
        url,
        expiresAt,
        fileName: file.fileName,
        remaining:
          license.maxDownloads - (license.downloadCount + 1),
      },
    };
  }

  private async getOwnedLicense(userId: string, licenseId: string) {
    const license = await this.prisma.db.license.findUnique({
      where: { id: licenseId },
    });
    if (!license || license.userId !== userId) {
      throw new NotFoundException('Lisensi tidak ditemukan');
    }
    return license;
  }
}

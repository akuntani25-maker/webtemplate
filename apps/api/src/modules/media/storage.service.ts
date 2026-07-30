import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { TypedConfigService } from '../../config/typed-config.service';
import type { StorageDriver } from './storage.driver';
import { R2Driver } from './drivers/r2.driver';
import { LocalDiskDriver } from './drivers/local-disk.driver';

/**
 * Abstraksi object storage.
 *
 * Driver dipilih otomatis (`STORAGE_DRIVER=auto`):
 *  - **r2** bila kredensial Cloudflare R2 lengkap → dipakai di produksi.
 *  - **local** bila belum → filesystem, agar pengembangan lokal jalan tanpa
 *    akun cloud. Tetap memakai URL bertanda tangan berumur pendek.
 *
 * File digital & bukti transfer selalu privat: akses hanya lewat signed URL.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: StorageDriver;

  constructor(private readonly config: TypedConfigService) {
    this.driver = this.createDriver();
    this.logger.log(`Object storage driver: ${this.driver.name}`);
    if (this.driver.name === 'local' && this.config.isProd) {
      this.logger.error(
        'PERINGATAN: driver penyimpanan lokal aktif di produksi. ' +
          'File tidak persisten/terbagi antar instance — konfigurasikan R2.',
      );
    }
  }

  private createDriver(): StorageDriver {
    const requested = this.config.get('STORAGE_DRIVER');
    const endpoint = this.config.get('R2_ENDPOINT');
    const accessKeyId = this.config.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get('R2_SECRET_ACCESS_KEY');
    const r2Ready = Boolean(endpoint && accessKeyId && secretAccessKey);

    if (requested === 'r2' && !r2Ready) {
      throw new Error(
        'STORAGE_DRIVER=r2 tetapi R2_ENDPOINT / R2_ACCESS_KEY_ID / ' +
          'R2_SECRET_ACCESS_KEY belum lengkap.',
      );
    }

    if (requested === 'r2' || (requested === 'auto' && r2Ready)) {
      return new R2Driver(this.config.get('R2_BUCKET'), {
        endpoint: endpoint!,
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      });
    }

    if (requested === 'auto') {
      this.logger.warn(
        'R2 belum dikonfigurasi — memakai penyimpanan lokal (mode pengembangan). ' +
          'Isi R2_* di .env untuk memakai Cloudflare R2.',
      );
    }
    return new LocalDiskDriver(
      this.config.get('STORAGE_LOCAL_DIR'),
      this.config.get('PUBLIC_API_URL'),
      this.signingSecret(),
    );
  }

  /** Secret khusus penandatanganan URL, diturunkan dari JWT secret. */
  private signingSecret(): string {
    return createHmac('sha256', this.config.get('JWT_ACCESS_SECRET'))
      .update('storage-url-signing')
      .digest('hex');
  }

  /** Driver aktif — dipakai StorageController untuk mode lokal. */
  get activeDriver(): StorageDriver {
    return this.driver;
  }

  get localDriver(): LocalDiskDriver | null {
    return this.driver instanceof LocalDiskDriver ? this.driver : null;
  }

  /** URL download berumur pendek (default 10 menit dari config). */
  async getDownloadUrl(
    storageKey: string,
    fileName?: string,
    ttlSeconds?: number,
  ): Promise<{ url: string; expiresAt: Date }> {
    return this.driver.getDownloadUrl(
      storageKey,
      fileName,
      ttlSeconds ?? this.config.get('DOWNLOAD_URL_TTL'),
    );
  }

  /** URL upload (PUT) berumur pendek untuk klien admin/user. */
  async getUploadUrl(
    storageKey: string,
    contentType: string,
    ttlSeconds = 300,
  ): Promise<{ url: string; key: string }> {
    return this.driver.getUploadUrl(storageKey, contentType, ttlSeconds);
  }

  async delete(storageKey: string): Promise<void> {
    await this.driver.delete(storageKey);
  }
}

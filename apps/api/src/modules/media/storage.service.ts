import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TypedConfigService } from '../../config/typed-config.service';

/**
 * Abstraksi object storage (Cloudflare R2 — S3-compatible).
 *
 * File digital disimpan privat. Akses download HANYA lewat signed URL
 * berumur pendek (default 10 menit). Upload dari admin memakai presigned PUT.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;

  constructor(private readonly config: TypedConfigService) {
    this.bucket = this.config.get('R2_BUCKET');
    const endpoint = this.config.get('R2_ENDPOINT');
    const accessKeyId = this.config.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get('R2_SECRET_ACCESS_KEY');

    if (endpoint && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.client = null;
      this.logger.warn(
        'R2 belum dikonfigurasi — signed URL akan gagal sampai env diisi.',
      );
    }
  }

  private ensure(): S3Client {
    if (!this.client) {
      throw new Error('Object storage (R2) belum dikonfigurasi');
    }
    return this.client;
  }

  /** URL download sekali pakai, berumur pendek (detik dari config). */
  async getDownloadUrl(
    storageKey: string,
    fileName?: string,
    ttlSeconds?: number,
  ): Promise<{ url: string; expiresAt: Date }> {
    const ttl = ttlSeconds ?? this.config.get('DOWNLOAD_URL_TTL');
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ResponseContentDisposition: fileName
        ? `attachment; filename="${encodeURIComponent(fileName)}"`
        : undefined,
    });
    const url = await getSignedUrl(this.ensure(), cmd, { expiresIn: ttl });
    return { url, expiresAt: new Date(Date.now() + ttl * 1000) };
  }

  /** Presigned PUT untuk upload langsung dari klien admin. */
  async getUploadUrl(
    storageKey: string,
    contentType: string,
    ttlSeconds = 300,
  ): Promise<{ url: string; key: string }> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.ensure(), cmd, {
      expiresIn: ttlSeconds,
    });
    return { url, key: storageKey };
  }

  async delete(storageKey: string): Promise<void> {
    await this.ensure().send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }
}

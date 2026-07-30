import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageDriver } from '../storage.driver';

/** Driver produksi: Cloudflare R2 (S3-compatible) dengan presigned URL. */
export class R2Driver implements StorageDriver {
  readonly name = 'r2' as const;

  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    opts: {
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
    },
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: opts.endpoint,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
    });
  }

  async getUploadUrl(
    storageKey: string,
    contentType: string,
    ttlSeconds: number,
  ): Promise<{ url: string; key: string }> {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ContentType: contentType,
      }),
      { expiresIn: ttlSeconds },
    );
    return { url, key: storageKey };
  }

  async getDownloadUrl(
    storageKey: string,
    fileName: string | undefined,
    ttlSeconds: number,
  ): Promise<{ url: string; expiresAt: Date }> {
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ResponseContentDisposition: fileName
          ? `attachment; filename="${encodeURIComponent(fileName)}"`
          : undefined,
      }),
      { expiresIn: ttlSeconds },
    );
    return { url, expiresAt: new Date(Date.now() + ttlSeconds * 1000) };
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }
}

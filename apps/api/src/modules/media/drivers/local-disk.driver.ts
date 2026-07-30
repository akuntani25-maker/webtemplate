import { createWriteStream } from 'fs';
import { mkdir, rm, stat } from 'fs/promises';
import { dirname, join, resolve, sep } from 'path';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import {
  createStorageToken,
  isSafeStorageKey,
  type StorageDriver,
} from '../storage.driver';

/**
 * Driver pengembangan lokal: menyimpan objek di filesystem.
 *
 * Menggantikan presigned URL S3 dengan URL ke endpoint API sendiri
 * (`/storage/upload` & `/storage/download`) yang dilindungi token HMAC
 * berumur pendek — jadi properti keamanan tetap sama:
 *  - file TIDAK bisa diakses tanpa token yang ditandatangani server
 *  - token kedaluwarsa (default 10 menit untuk download)
 *  - kuota download tetap ditegakkan di DownloadsService
 *
 * Tidak untuk produksi multi-instance (penyimpanan tidak terbagi) —
 * gunakan R2 di produksi.
 */
export class LocalDiskDriver implements StorageDriver {
  readonly name = 'local' as const;

  private readonly baseDir: string;

  constructor(
    baseDir: string,
    private readonly publicApiUrl: string,
    private readonly secret: string,
  ) {
    this.baseDir = resolve(baseDir);
  }

  /** Path absolut di disk untuk sebuah key, dengan proteksi path traversal. */
  resolvePath(storageKey: string): string {
    if (!isSafeStorageKey(storageKey)) {
      throw new Error('Object key tidak valid');
    }
    const full = resolve(join(this.baseDir, storageKey));
    if (full !== this.baseDir && !full.startsWith(this.baseDir + sep)) {
      throw new Error('Object key di luar direktori penyimpanan');
    }
    return full;
  }

  private buildUrl(path: string, token: string): string {
    const base = this.publicApiUrl.replace(/\/+$/, '');
    return `${base}${path}?token=${encodeURIComponent(token)}`;
  }

  async getUploadUrl(
    storageKey: string,
    contentType: string,
    ttlSeconds: number,
  ): Promise<{ url: string; key: string }> {
    this.resolvePath(storageKey); // validasi awal
    const token = createStorageToken(
      {
        k: storageKey,
        m: 'put',
        ct: contentType,
        exp: Math.floor(Date.now() / 1000) + ttlSeconds,
      },
      this.secret,
    );
    return { url: this.buildUrl('/storage/upload', token), key: storageKey };
  }

  async getDownloadUrl(
    storageKey: string,
    fileName: string | undefined,
    ttlSeconds: number,
  ): Promise<{ url: string; expiresAt: Date }> {
    this.resolvePath(storageKey);
    const token = createStorageToken(
      {
        k: storageKey,
        m: 'get',
        f: fileName,
        exp: Math.floor(Date.now() / 1000) + ttlSeconds,
      },
      this.secret,
    );
    return {
      url: this.buildUrl('/storage/download', token),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  /** Tulis stream ke disk (dipanggil StorageController saat PUT). */
  async writeStream(storageKey: string, source: Readable): Promise<void> {
    const full = this.resolvePath(storageKey);
    await mkdir(dirname(full), { recursive: true });
    await pipeline(source, createWriteStream(full));
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const s = await stat(this.resolvePath(storageKey));
      return s.isFile();
    } catch {
      return false;
    }
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.resolvePath(storageKey), { force: true });
  }
}

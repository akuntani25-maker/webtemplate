import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Kontrak driver object storage. Implementasi:
 *  - R2Driver         → produksi (Cloudflare R2 / S3-compatible)
 *  - LocalDiskDriver  → pengembangan lokal (tanpa kredensial cloud)
 *
 * Kedua driver menjaga properti keamanan yang sama:
 * file tidak dapat diakses tanpa URL bertanda tangan yang berumur pendek.
 */
export interface StorageDriver {
  readonly name: 'r2' | 'local';

  /** URL untuk mengunggah objek (PUT) — berumur pendek. */
  getUploadUrl(
    storageKey: string,
    contentType: string,
    ttlSeconds: number,
  ): Promise<{ url: string; key: string }>;

  /** URL untuk mengunduh objek (GET) — berumur pendek. */
  getDownloadUrl(
    storageKey: string,
    fileName: string | undefined,
    ttlSeconds: number,
  ): Promise<{ url: string; expiresAt: Date }>;

  delete(storageKey: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Token bertanda tangan (HMAC-SHA256) untuk driver lokal.
// Menggantikan peran presigned URL milik S3: hanya pemegang secret server yang
// bisa menerbitkan URL, dan URL kedaluwarsa otomatis.
// ---------------------------------------------------------------------------

export interface StorageTokenPayload {
  /** object key */
  k: string;
  /** mode akses */
  m: 'put' | 'get';
  /** epoch detik kedaluwarsa */
  exp: number;
  /** nama file untuk Content-Disposition (opsional) */
  f?: string;
  /** content type yang diizinkan saat put (opsional) */
  ct?: string;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(data: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(data).digest());
}

export function createStorageToken(
  payload: StorageTokenPayload,
  secret: string,
): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

/**
 * Verifikasi token. Mengembalikan payload bila valid, atau `null` bila
 * tanda tangan salah / format rusak / sudah kedaluwarsa.
 */
export function verifyStorageToken(
  token: string,
  secret: string,
): StorageTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, providedSig] = parts;
  const expectedSig = sign(body, secret);

  const a = fromB64url(providedSig);
  const b = fromB64url(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: StorageTokenPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return null;
  }

  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
    return null;
  }
  if (payload.m !== 'put' && payload.m !== 'get') return null;
  if (typeof payload.k !== 'string' || !payload.k) return null;

  return payload;
}

/**
 * Validasi object key agar tidak keluar dari direktori penyimpanan
 * (path traversal). Key dibuat server-side, ini pertahanan berlapis.
 */
export function isSafeStorageKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.startsWith('/') || key.includes('\\')) return false;
  if (key.split('/').some((seg) => seg === '..' || seg === '.' || seg === '')) {
    return false;
  }
  // Hanya karakter yang kita hasilkan sendiri
  return /^[A-Za-z0-9._/-]+$/.test(key);
}

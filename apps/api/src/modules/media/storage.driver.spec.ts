import { mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import {
  createStorageToken,
  verifyStorageToken,
  isSafeStorageKey,
} from './storage.driver';
import { LocalDiskDriver } from './drivers/local-disk.driver';

const SECRET = 'test-storage-secret';

describe('storage signed token', () => {
  const future = () => Math.floor(Date.now() / 1000) + 600;

  it('menerima token yang sah', () => {
    const token = createStorageToken(
      { k: 'proofs/a/b.png', m: 'get', exp: future() },
      SECRET,
    );
    const payload = verifyStorageToken(token, SECRET);
    expect(payload?.k).toBe('proofs/a/b.png');
    expect(payload?.m).toBe('get');
  });

  it('menolak token dengan secret berbeda (tanda tangan palsu)', () => {
    const token = createStorageToken(
      { k: 'proofs/a/b.png', m: 'get', exp: future() },
      SECRET,
    );
    expect(verifyStorageToken(token, 'secret-lain')).toBeNull();
  });

  it('menolak token yang payload-nya diubah', () => {
    const token = createStorageToken(
      { k: 'proofs/a/b.png', m: 'get', exp: future() },
      SECRET,
    );
    const forged = createStorageToken(
      { k: 'products/rahasia.zip', m: 'get', exp: future() },
      'secret-lain',
    );
    // ganti body, pertahankan signature asli
    const tampered = `${forged.split('.')[0]}.${token.split('.')[1]}`;
    expect(verifyStorageToken(tampered, SECRET)).toBeNull();
  });

  it('menolak token kedaluwarsa (TTL ditegakkan)', () => {
    const token = createStorageToken(
      { k: 'proofs/a/b.png', m: 'get', exp: Math.floor(Date.now() / 1000) - 1 },
      SECRET,
    );
    expect(verifyStorageToken(token, SECRET)).toBeNull();
  });

  it('menolak token rusak', () => {
    expect(verifyStorageToken('bukan-token', SECRET)).toBeNull();
    expect(verifyStorageToken('a.b.c', SECRET)).toBeNull();
  });
});

describe('isSafeStorageKey', () => {
  it('menerima key yang dihasilkan server', () => {
    expect(isSafeStorageKey('proofs/uuid/168-bukti.png')).toBe(true);
    expect(isSafeStorageKey('products/uuid/file-v1.zip')).toBe(true);
  });

  it('menolak path traversal & path absolut', () => {
    for (const bad of [
      '../../etc/passwd',
      'proofs/../../secret',
      '/etc/passwd',
      'proofs\\win',
      '',
      'proofs//double',
    ]) {
      expect(isSafeStorageKey(bad)).toBe(false);
    }
  });
});

describe('LocalDiskDriver', () => {
  it('menulis lalu membaca objek, dan menolak key berbahaya', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    const driver = new LocalDiskDriver(dir, 'http://localhost:4000/api/v1', SECRET);

    await driver.writeStream('proofs/x/bukti.txt', Readable.from(['halo']));
    expect(await driver.exists('proofs/x/bukti.txt')).toBe(true);
    expect(await readFile(join(dir, 'proofs/x/bukti.txt'), 'utf8')).toBe('halo');

    expect(() => driver.resolvePath('../keluar.txt')).toThrow();

    await driver.delete('proofs/x/bukti.txt');
    expect(await driver.exists('proofs/x/bukti.txt')).toBe(false);
  });

  it('membuat URL upload & download yang mengandung token valid', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    const driver = new LocalDiskDriver(dir, 'http://localhost:4000/api/v1', SECRET);

    const up = await driver.getUploadUrl('proofs/x/a.png', 'image/png', 300);
    expect(up.url).toContain('/storage/upload?token=');

    const down = await driver.getDownloadUrl('proofs/x/a.png', 'a.png', 600);
    expect(down.url).toContain('/storage/download?token=');
    expect(down.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const token = decodeURIComponent(down.url.split('token=')[1]);
    expect(verifyStorageToken(token, SECRET)?.m).toBe('get');
  });
});

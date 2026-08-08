import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';

/**
 * Unit test ringkas untuk perilaku rotasi & reuse detection TokenService.
 * Prisma & config di-mock agar test murni logika.
 */
describe('TokenService', () => {
  const jwt = new JwtService({});
  const config = {
    get: (k: string) =>
      ({
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
        JWT_ACCESS_TTL: 900,
        JWT_REFRESH_TTL: 604800,
      })[k],
  } as any;

  const makePrisma = () => {
    const store = new Map<string, any>();
    return {
      db: {
        refreshToken: {
          create: jest.fn(async ({ data }: any) => {
            const row = { id: `id-${store.size}`, ...data, revokedAt: null };
            store.set(data.tokenHash, row);
            return row;
          }),
          findUnique: jest.fn(
            async ({ where }: any) => store.get(where.tokenHash) ?? null,
          ),
          update: jest.fn(async ({ where, data }: any) => {
            for (const row of store.values()) {
              if (row.id === where.id) Object.assign(row, data);
            }
          }),
          updateMany: jest.fn(async ({ where, data }: any) => {
            for (const row of store.values()) {
              if (row.family === where.family) Object.assign(row, data);
            }
          }),
        },
        user: {
          findUnique: jest.fn(async () => ({
            id: 'u1',
            email: 'a@b.c',
            role: 'USER',
          })),
        },
      },
    } as any;
  };

  it('menerbitkan pasangan token pada login', async () => {
    const svc = new TokenService(jwt, config, makePrisma());
    const pair = await svc.issuePair(
      { id: 'u1', email: 'a@b.c', role: 'USER' as any },
      {},
    );
    expect(pair.accessToken).toBeTruthy();
    expect(pair.refreshToken).toBeTruthy();
  });

  it('mendeteksi reuse token yang sudah dirotasi', async () => {
    const prisma = makePrisma();
    const svc = new TokenService(jwt, config, prisma);
    const pair = await svc.issuePair(
      { id: 'u1', email: 'a@b.c', role: 'USER' as any },
      {},
    );

    // Rotasi pertama: sukses
    await svc.rotate(pair.refreshToken, {});

    // Pakai token lama lagi → harus REUSE_DETECTED
    await expect(svc.rotate(pair.refreshToken, {})).rejects.toThrow(
      'REUSE_DETECTED',
    );
  });
});

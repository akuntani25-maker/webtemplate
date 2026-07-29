import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import type { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { TypedConfigService } from '../../config/typed-config.service';
import type { AuthUser } from '../../common/decorators';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

/**
 * Mengelola penerbitan & rotasi token.
 *
 * Keamanan refresh token:
 *  - Token mentah TIDAK disimpan; hanya hash SHA-256.
 *  - Tiap token punya `family` untuk mendeteksi reuse.
 *  - Refresh mengganti token lama (`replacedBy`); jika token yang sudah
 *    diganti dipakai lagi → seluruh family dicabut (kemungkinan pencurian).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: TypedConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async signAccess(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<string> {
    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL'),
    });
  }

  private async signRefresh(userId: string, family: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, family, jti: randomUUID() },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_TTL'),
      },
    );
  }

  /** Terbitkan pasangan token baru untuk sebuah family (baru saat login). */
  async issuePair(
    user: { id: string; email: string; role: Role },
    ctx: { userAgent?: string; ip?: string },
    family?: string,
  ): Promise<TokenPair> {
    const fam = family ?? randomUUID();
    const accessToken = await this.signAccess(user);
    const refreshToken = await this.signRefresh(user.id, fam);
    const refreshExpiresAt = new Date(
      Date.now() + this.config.get('JWT_REFRESH_TTL') * 1000,
    );

    await this.prisma.db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        family: fam,
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  /**
   * Rotasi refresh token. Mengembalikan pasangan baru atau melempar error
   * jika token tidak valid / reuse terdeteksi.
   */
  async rotate(
    rawRefreshToken: string,
    ctx: { userAgent?: string; ip?: string },
  ): Promise<TokenPair & { userId: string }> {
    let decoded: { sub: string; family: string };
    try {
      decoded = await this.jwt.verifyAsync(rawRefreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new Error('INVALID_REFRESH');
    }

    const tokenHash = this.hash(rawRefreshToken);
    const stored = await this.prisma.db.refreshToken.findUnique({
      where: { tokenHash },
    });

    // Token tidak dikenal → mungkin dipakai ulang setelah dirotasi
    if (!stored) {
      await this.revokeFamily(decoded.family);
      throw new Error('REUSE_DETECTED');
    }

    // Sudah dicabut / diganti / kadaluarsa
    if (
      stored.revokedAt ||
      stored.replacedBy ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      await this.revokeFamily(stored.family);
      throw new Error('REUSE_DETECTED');
    }

    const user = await this.prisma.db.user.findUnique({
      where: { id: stored.userId },
    });
    if (!user) throw new Error('INVALID_REFRESH');

    // Terbitkan token baru dalam family yang sama
    const pair = await this.issuePair(user, ctx, stored.family);

    // Tandai token lama sudah diganti
    await this.prisma.db.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedBy: this.hash(pair.refreshToken),
      },
    });

    return { ...pair, userId: user.id };
  }

  /** Cabut satu refresh token (logout). */
  async revoke(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hash(rawRefreshToken);
    await this.prisma.db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Cabut seluruh family (dugaan pencurian token). */
  async revokeFamily(family: string): Promise<void> {
    await this.prisma.db.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

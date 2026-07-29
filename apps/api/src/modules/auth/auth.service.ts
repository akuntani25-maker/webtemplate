import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { TokenService, type TokenPair } from './token.service';
import { AuditService } from '../audit/audit.service';
import type { RegisterDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';

interface ReqCtx {
  userAgent?: string;
  ip?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

@Injectable()
export class AuthService {
  // Konfigurasi Argon2id (memory-hard, sesuai OWASP)
  private readonly argonOpts: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  private toPublic(u: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  }): PublicUser {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatarUrl,
    };
  }

  async register(
    dto: RegisterDto,
    ctx: ReqCtx,
  ): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.prisma.db.user.findUnique({ where: { email } });
    if (exists) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await argon2.hash(dto.password, this.argonOpts);
    const user = await this.prisma.db.user.create({
      data: { email, name: dto.name.trim(), passwordHash },
    });

    const tokens = await this.tokens.issuePair(user, ctx);
    await this.audit.log({
      userId: user.id,
      action: 'AUTH_REGISTER',
      ...ctx,
    });

    return { user: this.toPublic(user), tokens };
  }

  async login(
    dto: LoginDto,
    ctx: ReqCtx,
  ): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.db.user.findUnique({ where: { email } });

    // Verifikasi konstan-waktu semu: tetap verifikasi walau user tak ada
    const valid = user
      ? await argon2.verify(user.passwordHash, dto.password).catch(() => false)
      : await argon2
          .verify(
            '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$Zm9vYmFyYmF6', // dummy
            dto.password,
          )
          .catch(() => false);

    if (!user || !valid) {
      await this.audit.log({
        action: 'AUTH_LOGIN_FAILED',
        metadata: { email },
        ...ctx,
      });
      throw new UnauthorizedException('Email atau password salah');
    }

    await this.prisma.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.tokens.issuePair(user, ctx);
    await this.audit.log({ userId: user.id, action: 'AUTH_LOGIN', ...ctx });

    return { user: this.toPublic(user), tokens };
  }

  async refresh(rawRefreshToken: string, ctx: ReqCtx): Promise<TokenPair> {
    try {
      const result = await this.tokens.rotate(rawRefreshToken, ctx);
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        refreshExpiresAt: result.refreshExpiresAt,
      };
    } catch (e) {
      const reason = (e as Error).message;
      if (reason === 'REUSE_DETECTED') {
        await this.audit.log({
          action: 'AUTH_REFRESH_REUSE',
          ...ctx,
        });
      }
      throw new UnauthorizedException('Sesi tidak valid, silakan login ulang');
    }
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      await this.tokens.revoke(rawRefreshToken);
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    const ok = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!ok) throw new UnauthorizedException('Password saat ini salah');

    const passwordHash = await argon2.hash(dto.newPassword, this.argonOpts);
    await this.prisma.db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Cabut semua sesi (paksa login ulang di perangkat lain)
    await this.prisma.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({ userId, action: 'AUTH_PASSWORD_CHANGED' });
  }
}

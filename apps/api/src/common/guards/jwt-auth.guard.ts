import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY, type AuthUser } from '../decorators';
import { TypedConfigService } from '../../config/typed-config.service';

/**
 * Guard global. Memvalidasi access token dari cookie `access_token`
 * atau header `Authorization: Bearer`. Route dengan @Public() dilewati.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: TypedConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Autentikasi diperlukan');
    }

    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });
      req.user = { sub: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Token tidak valid atau kedaluwarsa');
    }
  }

  private extractToken(req: Request): string | undefined {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
      'access_token'
    ];
    if (cookieToken) return cookieToken;

    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return undefined;
  }
}

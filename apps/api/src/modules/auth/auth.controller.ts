import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TypedConfigService } from '../../config/typed-config.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE,
} from './cookie.util';
import { CurrentUser, Public, type AuthUser } from '../../common/decorators';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: TypedConfigService,
  ) {}

  private ctx(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.register(dto, this.ctx(req));
    setAuthCookies(res, tokens, this.config);
    return { data: user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.login(dto, this.ctx(req));
    setAuthCookies(res, tokens, this.config);
    return { data: user };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    if (!raw) throw new UnauthorizedException('Refresh token tidak ada');
    const tokens = await this.auth.refresh(raw, this.ctx(req));
    setAuthCookies(res, tokens, this.config);
    return { data: { ok: true } };
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    await this.auth.logout(raw);
    clearAuthCookies(res, this.config);
    return { data: { ok: true } };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return { data: await this.auth.me(user.sub) };
  }

  @HttpCode(200)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.auth.changePassword(user.sub, dto);
    return { data: { ok: true } };
  }
}

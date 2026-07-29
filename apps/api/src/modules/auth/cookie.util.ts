import type { CookieOptions, Response } from 'express';
import type { TypedConfigService } from '../../config/typed-config.service';
import type { TokenPair } from './token.service';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

function baseOptions(config: TypedConfigService): CookieOptions {
  return {
    httpOnly: true,
    secure: config.get('COOKIE_SECURE'),
    sameSite: 'strict',
    domain: config.get('COOKIE_DOMAIN'),
    path: '/',
  };
}

export function setAuthCookies(
  res: Response,
  tokens: TokenPair,
  config: TypedConfigService,
): void {
  const opts = baseOptions(config);
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...opts,
    maxAge: config.get('JWT_ACCESS_TTL') * 1000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...opts,
    // Refresh cookie hanya dikirim ke endpoint refresh/logout
    maxAge: config.get('JWT_REFRESH_TTL') * 1000,
  });
}

export function clearAuthCookies(
  res: Response,
  config: TypedConfigService,
): void {
  const opts = baseOptions(config);
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}

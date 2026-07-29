import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from '@prisma/client';

export interface AuthUser {
  sub: string;
  email: string;
  role: Role;
}

/** Tandai route sebagai publik (lewati JwtAuthGuard global). */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Batasi akses berdasarkan role. */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Ambil user terautentikasi dari request. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    return data && user ? user[data] : user;
  },
);

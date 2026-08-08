import { Body, Controller, Get, Injectable, Patch } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser, type AuthUser } from '../../common/decorators';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() avatarUrl?: string;
}

@Injectable()
class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { orders: true, licenses: true, wishlist: true } },
      },
    });
    return { data: user };
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.db.user.update({
      where: { id: userId },
      data: { name: dto.name, phone: dto.phone, avatarUrl: dto.avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
      },
    });
    return { data: user };
  }
}

@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.users.me(user.sub);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.update(user.sub, dto);
  }
}

export { UsersService };

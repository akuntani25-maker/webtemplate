import {
  Body,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginated, PaginationDto } from '../../../common/dto/pagination.dto';
import { AuditService } from '../../audit/audit.service';
import { CurrentUser, Roles, type AuthUser } from '../../../common/decorators';

class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
}

@Injectable()
class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.db.user.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async update(id: string, dto: UpdateUserDto, adminId: string) {
    const exists = await this.prisma.db.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User tidak ditemukan');
    const user = await this.prisma.db.user.update({
      where: { id },
      data: { name: dto.name, role: dto.role },
      select: { id: true, name: true, email: true, role: true },
    });
    if (dto.role && dto.role !== exists.role) {
      await this.audit.log({
        userId: adminId,
        action: 'USER_ROLE_CHANGED',
        entity: 'User',
        entityId: id,
        metadata: { from: exists.role, to: dto.role },
      });
    }
    return { data: user };
  }
}

@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get() list(@Query() query: PaginationDto) {
    return this.users.list(query);
  }
  @Patch(':id')
  update(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(id, dto, admin.sub);
  }
}

export { AdminUsersService };

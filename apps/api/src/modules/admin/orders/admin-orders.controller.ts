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
import { IsEnum } from 'class-validator';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginated, PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../../../common/decorators';

class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus;
}

@Injectable()
class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto & { status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status as OrderStatus } : {}),
      ...(query.q
        ? {
            OR: [
              { number: { contains: query.q, mode: 'insensitive' } },
              { customerEmail: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          invoice: { select: { status: true, paymentMethod: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.db.order.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async detail(id: string) {
    const order = await this.prisma.db.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
        invoice: { include: { proofs: true } },
        licenses: true,
        coupon: { select: { code: true, type: true, value: true } },
      },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return { data: order };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const exists = await this.prisma.db.order.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Order tidak ditemukan');
    const order = await this.prisma.db.order.update({
      where: { id },
      data: { status },
    });
    return { data: order };
  }
}

@Roles('ADMIN')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: AdminOrdersService) {}

  @Get() list(@Query() query: PaginationDto & { status?: string }) {
    return this.orders.list(query);
  }
  @Get(':id') detail(@Param('id') id: string) {
    return this.orders.detail(id);
  }
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto.status);
  }
}

export { AdminOrdersService };

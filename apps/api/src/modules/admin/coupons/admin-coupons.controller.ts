import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CouponType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { Roles } from '../../../common/decorators';

class CouponDto {
  @IsString() code!: string;
  @IsEnum(CouponType) type!: CouponType;
  @IsInt() @Min(0) value!: number;
  @IsOptional() @IsInt() @Min(0) minPurchase?: number;
  @IsOptional() @IsInt() @Min(0) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(0) usageLimit?: number;
  @IsOptional() @IsInt() @Min(0) perUserLimit?: number;
  @IsOptional() @IsISO8601() startsAt?: string;
  @IsOptional() @IsISO8601() expiresAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Injectable()
class AdminCouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.db.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data: items };
  }

  async create(dto: CouponDto) {
    const item = await this.prisma.db.coupon.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        type: dto.type,
        value: dto.value,
        minPurchase: dto.minPurchase ?? 0,
        maxDiscount: dto.maxDiscount,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: dto.isActive ?? true,
      },
    });
    return { data: item };
  }

  async update(id: string, dto: CouponDto) {
    const exists = await this.prisma.db.coupon.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Kupon tidak ditemukan');
    const item = await this.prisma.db.coupon.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase().trim() : undefined,
        type: dto.type,
        value: dto.value,
        minPurchase: dto.minPurchase,
        maxDiscount: dto.maxDiscount,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: dto.isActive,
      },
    });
    return { data: item };
  }

  async remove(id: string) {
    const exists = await this.prisma.db.coupon.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Kupon tidak ditemukan');
    await this.prisma.db.coupon.delete({ where: { id } });
    return { data: { id, deleted: true } };
  }
}

@Roles('ADMIN')
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly coupons: AdminCouponsService) {}

  @Get() list() {
    return this.coupons.list();
  }
  @Post() create(@Body() dto: CouponDto) {
    return this.coupons.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: CouponDto) {
    return this.coupons.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string) {
    return this.coupons.remove(id);
  }
}

export { AdminCouponsService };

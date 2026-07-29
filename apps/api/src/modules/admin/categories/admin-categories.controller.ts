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
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PrismaService } from '../../../database/prisma.service';
import { slugify } from '../../../common/utils/slug.util';
import { Roles } from '../../../common/decorators';

class CategoryDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Injectable()
class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.db.category.findMany({
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return { data: items };
  }

  async create(dto: CategoryDto) {
    const item = await this.prisma.db.category.create({
      data: {
        name: dto.name,
        slug: dto.slug ? slugify(dto.slug) : slugify(dto.name),
        description: dto.description,
        parentId: dto.parentId,
        iconUrl: dto.iconUrl,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    return { data: item };
  }

  async update(id: string, dto: CategoryDto) {
    const exists = await this.prisma.db.category.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Kategori tidak ditemukan');
    const item = await this.prisma.db.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug ? slugify(dto.slug) : undefined,
        description: dto.description,
        parentId: dto.parentId,
        iconUrl: dto.iconUrl,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    return { data: item };
  }

  async remove(id: string) {
    const exists = await this.prisma.db.category.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Kategori tidak ditemukan');
    await this.prisma.db.category.delete({ where: { id } });
    return { data: { id, deleted: true } };
  }
}

@Roles('ADMIN')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  @Get() list() {
    return this.categories.list();
  }
  @Post() create(@Body() dto: CategoryDto) {
    return this.categories.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: CategoryDto) {
    return this.categories.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}

export { AdminCategoriesService };

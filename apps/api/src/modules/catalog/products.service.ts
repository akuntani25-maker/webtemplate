import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private orderBy(
    sort: QueryProductsDto['sort'],
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'popular':
        return { purchaseCount: 'desc' };
      case 'rating':
        return { ratingAvg: 'desc' };
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  async list(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ProductWhereInput = {
      status: 'PUBLISHED',
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { shortDesc: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.tag ? { tags: { some: { slug: query.tag } } } : {}),
      ...(query.min !== undefined || query.max !== undefined
        ? {
            price: {
              ...(query.min !== undefined ? { gte: query.min } : {}),
              ...(query.max !== undefined ? { lte: query.max } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.db.product.findMany({
        where,
        orderBy: this.orderBy(query.sort),
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { slug: true, name: true } } },
      }),
      this.prisma.db.product.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async rail(kind: 'latest' | 'popular' | 'featured' | 'best-seller') {
    const base: Prisma.ProductWhereInput = { status: 'PUBLISHED' };
    const map: Record<string, Prisma.ProductFindManyArgs> = {
      latest: { where: base, orderBy: { createdAt: 'desc' } },
      popular: { where: base, orderBy: { purchaseCount: 'desc' } },
      featured: { where: { ...base, isFeatured: true } },
      'best-seller': {
        where: { ...base, isBestSeller: true },
        orderBy: { purchaseCount: 'desc' },
      },
    };
    const items = await this.prisma.db.product.findMany({
      ...map[kind],
      take: 8,
      include: { category: { select: { slug: true, name: true } } },
    });
    return { data: items };
  }

  async detail(slug: string) {
    const product = await this.prisma.db.product.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        category: true,
        tags: true,
        images: { orderBy: { sortOrder: 'asc' } },
        faqs: { orderBy: { sortOrder: 'asc' } },
        changelogs: { orderBy: { releasedAt: 'desc' } },
        reviews: {
          where: { status: 'PUBLISHED' },
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');

    // Naikkan view count (fire-and-forget)
    void this.prisma.db.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return { data: product };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../media/storage.service';
import { slugify } from '../../../common/utils/slug.util';
import { paginated, PaginationDto } from '../../../common/dto/pagination.dto';
import type {
  CreateProductDto,
  UpdateProductDto,
  RegisterFileDto,
} from './dto/product.dto';

@Injectable()
export class AdminProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(query: PaginationDto & { status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ProductWhereInput = {
      ...(query.q
        ? { name: { contains: query.q, mode: 'insensitive' } }
        : {}),
      ...(query.status ? { status: query.status as never } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true, slug: true } },
          _count: { select: { files: true, orderItems: true } },
        },
      }),
      this.prisma.db.product.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async detail(id: string) {
    const product = await this.prisma.db.product.findUnique({
      where: { id },
      include: {
        category: true,
        tags: true,
        images: { orderBy: { sortOrder: 'asc' } },
        files: true,
        faqs: { orderBy: { sortOrder: 'asc' } },
        changelogs: { orderBy: { releasedAt: 'desc' } },
      },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return { data: product };
  }

  private async uniqueSlug(base: string, ignoreId?: string): Promise<string> {
    const root = slugify(base);
    let candidate = root;
    let n = 1;
    // Cari slug unik (termasuk yang soft-deleted agar tak bentrok unique index)
    for (;;) {
      const existing = await this.prisma.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === ignoreId) return candidate;
      candidate = `${root}-${n++}`;
    }
  }

  async create(dto: CreateProductDto) {
    const category = await this.prisma.db.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BadRequestException('Kategori tidak valid');

    if (dto.discountPrice != null && dto.discountPrice > dto.price) {
      throw new BadRequestException('Harga diskon tidak boleh melebihi harga');
    }

    const slug = await this.uniqueSlug(dto.slug ?? dto.name);

    const product = await this.prisma.db.product.create({
      data: {
        name: dto.name,
        slug,
        categoryId: dto.categoryId,
        description: dto.description,
        shortDesc: dto.shortDesc,
        price: dto.price,
        discountPrice: dto.discountPrice,
        demoType: dto.demoType ?? 'OTHER',
        demoUrl: dto.demoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        videoUrl: dto.videoUrl,
        features: dto.features ?? [],
        version: dto.version,
        fileFormat: dto.fileFormat,
        isFeatured: dto.isFeatured ?? false,
        isBestSeller: dto.isBestSeller ?? false,
        status: dto.status ?? 'DRAFT',
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        ...(dto.tagIds?.length
          ? { tags: { connect: dto.tagIds.map((id) => ({ id })) } }
          : {}),
      },
    });
    return { data: product };
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.db.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Produk tidak ditemukan');

    const price = dto.price ?? existing.price;
    const discount = dto.discountPrice ?? existing.discountPrice ?? undefined;
    if (discount != null && discount > price) {
      throw new BadRequestException('Harga diskon tidak boleh melebihi harga');
    }

    const product = await this.prisma.db.product.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug ? await this.uniqueSlug(dto.slug, id) : undefined,
        categoryId: dto.categoryId,
        description: dto.description,
        shortDesc: dto.shortDesc,
        price: dto.price,
        discountPrice: dto.discountPrice,
        demoType: dto.demoType,
        demoUrl: dto.demoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        videoUrl: dto.videoUrl,
        features: dto.features,
        version: dto.version,
        fileFormat: dto.fileFormat,
        isFeatured: dto.isFeatured,
        isBestSeller: dto.isBestSeller,
        status: dto.status,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        lastUpdatedAt: new Date(),
        ...(dto.tagIds
          ? { tags: { set: dto.tagIds.map((tid) => ({ id: tid })) } }
          : {}),
      },
    });
    return { data: product };
  }

  async remove(id: string) {
    const existing = await this.prisma.db.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Produk tidak ditemukan');
    await this.prisma.db.product.delete({ where: { id } }); // soft delete
    return { data: { id, deleted: true } };
  }

  // --- File digital (privat) ---

  /** Presigned PUT untuk upload file produk langsung ke R2. */
  async presignUpload(productId: string, fileName: string, contentType: string) {
    const product = await this.prisma.db.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    const key = `products/${productId}/${Date.now()}-${slugify(fileName)}`;
    const { url } = await this.storage.getUploadUrl(key, contentType);
    return { data: { uploadUrl: url, storageKey: key } };
  }

  async registerFile(productId: string, dto: RegisterFileDto) {
    const product = await this.prisma.db.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    const file = await this.prisma.db.productFile.create({
      data: { productId, ...dto },
    });
    return { data: file };
  }

  async removeFile(productId: string, fileId: string) {
    const file = await this.prisma.db.productFile.findFirst({
      where: { id: fileId, productId },
    });
    if (!file) throw new NotFoundException('File tidak ditemukan');
    await this.prisma.db.productFile.delete({ where: { id: fileId } });
    return { data: { id: fileId, deleted: true } };
  }
}

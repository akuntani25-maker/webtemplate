import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Post,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser, type AuthUser } from '../../common/decorators';

class AddWishlistDto {
  @IsString() productId!: string;
}

@Injectable()
class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.db.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            price: true,
            discountPrice: true,
            thumbnailUrl: true,
            ratingAvg: true,
          },
        },
      },
    });
    return { data: items.map((i) => i.product) };
  }

  async add(userId: string, productId: string) {
    const item = await this.prisma.db.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
    return { data: item };
  }

  async remove(userId: string, productId: string) {
    await this.prisma.db.wishlistItem.deleteMany({
      where: { userId, productId },
    });
    return { data: { productId, removed: true } };
  }
}

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.wishlist.list(user.sub);
  }

  @Post()
  add(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistDto) {
    return this.wishlist.add(user.sub, dto.productId);
  }

  @Delete(':productId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.wishlist.remove(user.sub, productId);
  }
}

export { WishlistService };

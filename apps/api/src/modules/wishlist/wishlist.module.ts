import { Module } from '@nestjs/common';
import { WishlistController, WishlistService } from './wishlist.controller';

@Module({
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}

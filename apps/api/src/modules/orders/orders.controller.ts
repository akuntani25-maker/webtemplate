import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CouponsService } from './coupons.service';
import { CheckoutDto, ValidateCouponDto } from './dto/checkout.dto';
import { CurrentUser, Public, type AuthUser } from '../../common/decorators';

@Controller()
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly coupons: CouponsService,
  ) {}

  @Public()
  @Post('coupons/validate')
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    const { coupon, discount } = await this.coupons.validate(
      dto.code,
      dto.subtotal,
    );
    return {
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('orders/checkout')
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.orders.checkout(user.sub, dto);
  }

  @Get('orders')
  myOrders(@CurrentUser() user: AuthUser) {
    return this.orders.myOrders(user.sub);
  }

  @Get('orders/:number')
  detail(@CurrentUser() user: AuthUser, @Param('number') number: string) {
    return this.orders.myOrderDetail(user.sub, number);
  }
}

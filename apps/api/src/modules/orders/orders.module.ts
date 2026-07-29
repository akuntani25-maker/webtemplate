import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CouponsService } from './coupons.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  controllers: [OrdersController, InvoicesController],
  providers: [OrdersService, CouponsService, InvoicesService],
  exports: [OrdersService],
})
export class OrdersModule {}

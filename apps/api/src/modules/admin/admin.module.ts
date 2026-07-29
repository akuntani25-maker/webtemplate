import { Module } from '@nestjs/common';

import { AdminStatsController } from './stats/admin-stats.controller';
import { AdminStatsService } from './stats/admin-stats.service';

import { AdminProductsController } from './products/admin-products.controller';
import { AdminProductsService } from './products/admin-products.service';

import {
  AdminCategoriesController,
  AdminCategoriesService,
} from './categories/admin-categories.controller';

import {
  AdminCouponsController,
  AdminCouponsService,
} from './coupons/admin-coupons.controller';

import {
  AdminOrdersController,
  AdminOrdersService,
} from './orders/admin-orders.controller';

import { AdminPaymentsController } from './payments/admin-payments.controller';
import { AdminPaymentsService } from './payments/admin-payments.service';

import {
  AdminUsersController,
  AdminUsersService,
} from './users/admin-users.controller';

import {
  AdminContentController,
  AdminContentService,
} from './content/admin-content.controller';

/**
 * Tahap 4 — Admin Panel (backend). Semua route diproteksi @Roles('ADMIN')
 * di masing-masing controller (JwtAuthGuard + RolesGuard global).
 */
@Module({
  controllers: [
    AdminStatsController,
    AdminProductsController,
    AdminCategoriesController,
    AdminCouponsController,
    AdminOrdersController,
    AdminPaymentsController,
    AdminUsersController,
    AdminContentController,
  ],
  providers: [
    AdminStatsService,
    AdminProductsService,
    AdminCategoriesService,
    AdminCouponsService,
    AdminOrdersService,
    AdminPaymentsService,
    AdminUsersService,
    AdminContentService,
  ],
})
export class AdminModule {}

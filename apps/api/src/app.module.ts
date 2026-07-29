import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigModule } from './config/config.module';
import { TypedConfigService } from './config/typed-config.service';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './modules/audit/audit.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './jobs/jobs.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    AppConfigModule,
    // JwtModule global agar JwtAuthGuard (global) bisa memakai JwtService
    JwtModule.register({ global: true }),
    ThrottlerModule.forRootAsync({
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL') * 1000,
            limit: config.get('THROTTLE_LIMIT'),
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),

    DatabaseModule,
    AuditModule,
    MediaModule,
    NotificationModule,

    AuthModule,
    UsersModule,
    CatalogModule,
    OrdersModule,
    WishlistModule,
    DownloadsModule,
    AdminModule,
    HealthModule,
    JobsModule,
  ],
  providers: [
    // Urutan penting: throttle → auth → roles
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}

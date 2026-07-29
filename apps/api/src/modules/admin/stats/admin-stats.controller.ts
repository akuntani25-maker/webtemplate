import { Controller, Get, Query } from '@nestjs/common';
import { AdminStatsService } from './admin-stats.service';
import { Roles } from '../../../common/decorators';

@Roles('ADMIN')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get('overview')
  overview() {
    return this.stats.overview();
  }

  @Get('sales')
  sales(@Query('range') range?: string) {
    return this.stats.sales(range ? parseInt(range, 10) : 30);
  }

  @Get('top-products')
  topProducts(@Query('limit') limit?: string) {
    return this.stats.topProducts(limit ? parseInt(limit, 10) : 10);
  }

  @Get('downloads')
  downloads(@Query('range') range?: string) {
    return this.stats.downloads(range ? parseInt(range, 10) : 30);
  }
}

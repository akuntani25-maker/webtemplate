import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { Public } from '../../common/decorators';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: QueryProductsDto) {
    return this.products.list(query);
  }

  @Get('latest')
  latest() {
    return this.products.rail('latest');
  }

  @Get('popular')
  popular() {
    return this.products.rail('popular');
  }

  @Get('featured')
  featured() {
    return this.products.rail('featured');
  }

  @Get('best-seller')
  bestSeller() {
    return this.products.rail('best-seller');
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.products.detail(slug);
  }
}

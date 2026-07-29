import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  RegisterFileDto,
} from './dto/product.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../../../common/decorators';

@Roles('ADMIN')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: AdminProductsService) {}

  @Get()
  list(@Query() query: PaginationDto & { status?: string }) {
    return this.products.list(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.products.detail(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }

  @Post(':id/files/presign')
  presign(
    @Param('id') id: string,
    @Body() body: { fileName: string; contentType: string },
  ) {
    return this.products.presignUpload(id, body.fileName, body.contentType);
  }

  @Post(':id/files')
  registerFile(@Param('id') id: string, @Body() dto: RegisterFileDto) {
    return this.products.registerFile(id, dto);
  }

  @Delete(':id/files/:fileId')
  removeFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    return this.products.removeFile(id, fileId);
  }
}

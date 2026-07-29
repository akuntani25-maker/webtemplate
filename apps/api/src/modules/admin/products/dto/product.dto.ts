import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DemoType, ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  categoryId!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDesc?: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountPrice?: number;

  @IsOptional()
  @IsEnum(DemoType)
  demoType?: DemoType;

  @IsOptional()
  @IsString()
  demoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  fileFormat?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}

// Semua field opsional untuk update parsial
export class UpdateProductDto extends CreateProductDto {
  @IsOptional()
  declare name: string;

  @IsOptional()
  declare categoryId: string;

  @IsOptional()
  declare description: string;

  @IsOptional()
  declare price: number;
}

export class RegisterFileDto {
  @IsString()
  label!: string;

  @IsString()
  storageKey!: string;

  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  version?: string;
}

export class ProductImageDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ProductImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images!: ProductImageDto[];
}

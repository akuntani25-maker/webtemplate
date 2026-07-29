import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CheckoutItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}

export class CheckoutDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Keranjang tidak boleh kosong' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsString()
  @MaxLength(100)
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsInt()
  @Min(0)
  subtotal!: number;
}

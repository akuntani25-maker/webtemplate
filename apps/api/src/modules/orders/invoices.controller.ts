import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';
import { InvoicesService } from './invoices.service';
import { CurrentUser, type AuthUser } from '../../common/decorators';

class PresignProofDto {
  @IsString() fileName!: string;
  @IsString() contentType!: string;
}

class SubmitProofDto {
  @IsString() storageKey!: string;
  @IsOptional() @IsString() senderName?: string;
  @IsOptional() @IsString() senderBank?: string;
  @IsOptional() @IsInt() @Min(0) amount?: number;
  @IsOptional() @IsISO8601() transferredAt?: string;
  @IsOptional() @IsString() note?: string;
}

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get(':number')
  detail(@CurrentUser() user: AuthUser, @Param('number') number: string) {
    return this.invoices.detail(user.sub, number);
  }

  @Post(':number/proof/presign')
  presign(
    @CurrentUser() user: AuthUser,
    @Param('number') number: string,
    @Body() dto: PresignProofDto,
  ) {
    return this.invoices.presignProof(
      user.sub,
      number,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':number/proof')
  submit(
    @CurrentUser() user: AuthUser,
    @Param('number') number: string,
    @Body() dto: SubmitProofDto,
  ) {
    return this.invoices.submitProof(user.sub, number, dto);
  }
}

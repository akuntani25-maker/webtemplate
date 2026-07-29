import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminPaymentsService } from './admin-payments.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CurrentUser, Roles, type AuthUser } from '../../../common/decorators';

class RejectDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@Roles('ADMIN')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: AdminPaymentsService) {}

  @Get()
  list(@Query() query: PaginationDto & { status?: string }) {
    return this.payments.list(query);
  }

  @Post(':proofId/approve')
  approve(
    @CurrentUser() admin: AuthUser,
    @Param('proofId') proofId: string,
  ) {
    return this.payments.approve(proofId, admin.sub);
  }

  @Post(':proofId/reject')
  reject(
    @CurrentUser() admin: AuthUser,
    @Param('proofId') proofId: string,
    @Body() dto: RejectDto,
  ) {
    return this.payments.reject(
      proofId,
      admin.sub,
      dto.reason ?? 'Tidak valid',
    );
  }
}

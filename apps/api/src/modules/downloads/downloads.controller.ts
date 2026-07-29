import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { DownloadsService } from './downloads.service';
import { CurrentUser, type AuthUser } from '../../common/decorators';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  @Get(':licenseId/files')
  listFiles(
    @CurrentUser() user: AuthUser,
    @Param('licenseId') licenseId: string,
  ) {
    return this.downloads.listFiles(user.sub, licenseId);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':licenseId/files/:fileId/sign')
  sign(
    @CurrentUser() user: AuthUser,
    @Param('licenseId') licenseId: string,
    @Param('fileId') fileId: string,
    @Req() req: Request,
  ) {
    return this.downloads.sign(user.sub, licenseId, fileId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}

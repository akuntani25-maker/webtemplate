import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import type { Request, Response } from 'express';
import { StorageService } from './storage.service';
import { verifyStorageToken } from './storage.driver';
import { TypedConfigService } from '../../config/typed-config.service';
import { createHmac } from 'crypto';
import { Public } from '../../common/decorators';

/**
 * Endpoint pendamping driver penyimpanan **lokal** (mode pengembangan).
 *
 * Berperan seperti endpoint presigned URL milik S3/R2:
 * autentikasi berasal dari **token HMAC berumur pendek** pada query string,
 * bukan dari cookie sesi — karena itu route ditandai @Public().
 * Tanpa token valid, file tidak dapat diakses.
 *
 * Saat driver R2 aktif, endpoint ini tidak pernah dipakai (upload/download
 * langsung ke Cloudflare) dan akan membalas 404.
 */
@Public()
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(
    private readonly storage: StorageService,
    private readonly config: TypedConfigService,
  ) {}

  private secret(): string {
    return createHmac('sha256', this.config.get('JWT_ACCESS_SECRET'))
      .update('storage-url-signing')
      .digest('hex');
  }

  private requireLocal() {
    const local = this.storage.localDriver;
    if (!local) {
      throw new NotFoundException();
    }
    return local;
  }

  @Put('upload')
  async upload(
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const local = this.requireLocal();
    const payload = token ? verifyStorageToken(token, this.secret()) : null;
    if (!payload || payload.m !== 'put') {
      throw new BadRequestException(
        'Token upload tidak valid atau kedaluwarsa',
      );
    }

    await local.writeStream(payload.k, req);
    this.logger.log(`Objek tersimpan (lokal): ${payload.k}`);
    res.status(200).json({ data: { key: payload.k, uploaded: true } });
  }

  @Get('download')
  async download(
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const local = this.requireLocal();
    const payload = token ? verifyStorageToken(token, this.secret()) : null;
    if (!payload || payload.m !== 'get') {
      throw new BadRequestException(
        'Tautan unduh tidak valid atau sudah kedaluwarsa',
      );
    }

    if (!(await local.exists(payload.k))) {
      throw new NotFoundException('File tidak ditemukan di penyimpanan');
    }

    const fileName = payload.f ?? payload.k.split('/').pop() ?? 'download';
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.setHeader('Content-Type', 'application/octet-stream');
    createReadStream(local.resolvePath(payload.k)).pipe(res);
  }
}

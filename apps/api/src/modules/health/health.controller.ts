import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../../common/decorators';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('live')
  live() {
    return { data: { status: 'ok', ts: new Date().toISOString() } };
  }

  @Public()
  @Get('ready')
  async ready() {
    let db = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    return {
      data: { status: db === 'ok' ? 'ok' : 'degraded', db },
    };
  }
}

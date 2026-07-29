import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.validation';

/**
 * Wrapper tipe-aman di atas ConfigService bawaan Nest.
 * `get('JWT_ACCESS_SECRET')` mengembalikan tipe yang benar dari skema Zod.
 */
@Injectable()
export class TypedConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get isProd(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get webOrigins(): string[] {
    return this.get('WEB_ORIGIN')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
}

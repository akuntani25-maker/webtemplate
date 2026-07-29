import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TypedConfigService } from './config/typed-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(TypedConfigService);
  const logger = new Logger('Bootstrap');

  // --- Keamanan HTTP ---
  app.use(
    helmet({
      contentSecurityPolicy: config.isProd ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  // CORS ketat + kredensial (cookie)
  app.enableCors({
    origin: config.webOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Prefix & versioning
  app.setGlobalPrefix(config.get('API_PREFIX'));

  // Validasi & sanitasi input global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // buang properti tak dikenal
      forbidNonWhitelisted: true, // tolak properti tak dikenal
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = config.get('PORT');
  await app.listen(port);
  logger.log(
    `API berjalan di http://localhost:${port}/${config.get('API_PREFIX')}`,
  );
}

void bootstrap();

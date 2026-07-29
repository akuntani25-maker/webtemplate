import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filter global: menyeragamkan bentuk error dan menyembunyikan detail internal
 * di produksi (anti information disclosure).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Terjadi kesalahan';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b.message as string | string[]) ?? message;
        error = (b.error as string) ?? exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    // Jangan bocorkan detail 5xx di produksi
    if (status >= 500 && process.env.NODE_ENV === 'production') {
      message = 'Terjadi kesalahan pada server';
      error = 'InternalServerError';
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}

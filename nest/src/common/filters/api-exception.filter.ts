import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const response =
      exception instanceof HttpException ? exception.getResponse() : null;
    const body =
      typeof response === 'object' && response !== null
        ? (response as { message?: string | string[] })
        : null;
    const details = Array.isArray(body?.message) ? body.message : undefined;
    const code =
      (
        {
          400: 'BAD_REQUEST',
          401: 'UNAUTHORIZED',
          403: 'FORBIDDEN',
          404: 'NOT_FOUND',
          429: 'TOO_MANY_REQUESTS',
          503: 'SERVICE_UNAVAILABLE',
        } as Record<number, string>
      )[status] ?? 'INTERNAL_SERVER_ERROR';
    const message =
      status >= 500
        ? 'An unexpected error occurred.'
        : status === 429
          ? 'Too many requests. Try again in a minute.'
          : details
            ? 'Request validation failed.'
            : typeof body?.message === 'string'
              ? body.message
              : typeof response === 'string'
                ? response
                : 'Request failed.';
    if (status >= 500)
      this.logger.error(
        'Unhandled request exception',
        exception instanceof Error ? exception.stack : undefined,
      );
    context
      .getResponse<Response>()
      .set('Cache-Control', 'private, no-store')
      .status(status)
      .json({
        statusCode: status,
        error: { code, message, ...(details ? { details } : {}) },
        path: context.getRequest<Request>().path,
      });
  }
}

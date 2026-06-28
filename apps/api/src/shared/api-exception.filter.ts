import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      response.status(status).json({
        error: {
          code: this.getCode(status),
          message: this.getMessage(body, exception.message),
          details: typeof body === 'object' ? body : undefined,
        },
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          process.env.NODE_ENV === 'test' && exception instanceof Error
            ? exception.message
            : 'An unexpected error occurred.',
      },
    });
  }

  private getCode(status: number): string {
    const codes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
    };

    return codes[status] ?? 'HTTP_ERROR';
  }

  private getMessage(body: string | object, fallback: string): string {
    if (typeof body === 'string') {
      return body;
    }

    if ('message' in body) {
      const message = body.message;
      return Array.isArray(message) ? message.join(', ') : String(message);
    }

    return fallback;
  }
}

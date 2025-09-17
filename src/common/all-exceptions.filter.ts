import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.getErrorDetails(exception);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: (request as any).url,
    });
  }

  private getErrorDetails(exception: unknown): { status: number; message: string } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message = typeof response === 'object' && response !== null
        ? (response as any).message || 'Http exception'
        : response as string;
      return { status, message };
    }

    if (exception instanceof Error) {
      const message = exception.message.toLowerCase();
      if (message.includes('provider') || message.includes('circuit')) {
        this.logger.error('Service error', { error: exception.message, stack: exception.stack });
        return { status: HttpStatus.SERVICE_UNAVAILABLE, message: 'Service temporarily unavailable' };
      }
      this.logger.error('Unhandled error', { error: exception.message, stack: exception.stack });
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Unknown error' };
  }
}


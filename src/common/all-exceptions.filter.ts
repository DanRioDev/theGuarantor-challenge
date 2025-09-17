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

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      // For provider errors or other errors, treat as service unavailable
      if (exception.message.includes('provider') || exception.message.includes('circuit')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Service temporarily unavailable';
      }
      this.logger.error('Unhandled exception', {
        error: exception.message,
        stack: exception.stack,
      });
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: (request as any).url,
    });
  }
}


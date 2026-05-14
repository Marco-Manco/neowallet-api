import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, errorResponse } = this.buildErrorResponse(exception, request.url);

    this.logger.error(
      `${request.method} ${request.url} ${statusCode} - ${exception.message}`,
      exception.stack,
    );

    response.status(statusCode).json(errorResponse);
  }

  private buildErrorResponse(error: Error, path: string): { statusCode: number; errorResponse: ErrorResponse } {
    const timestamp = new Date().toISOString();

    if (error instanceof DomainException) {
      return {
        statusCode: error.statusCode,
        errorResponse: {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            timestamp,
            path,
          },
        },
      };
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const message = typeof response === 'string' ? response : (response as any).message || 'An error occurred';

      return {
        statusCode: status,
        errorResponse: {
          success: false,
          error: {
            code: HttpStatus[status] || 'HTTP_ERROR',
            message: Array.isArray(message) ? message[0] : message,
            timestamp,
            path,
          },
        },
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp,
          path,
        },
      },
    };
  }
}

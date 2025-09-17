import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RateLimiterGuard.name);

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientIp = this.getClientIp(request);

    const key = `rate_limit:${clientIp}`;
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 100; // 100 requests per minute

    try {
      const currentCount = await this.getCurrentCount(key);

      if (currentCount >= maxRequests) {
        this.logger.warn(`Rate limit exceeded for IP: ${clientIp}`, {
          currentCount,
          maxRequests,
          clientIp,
        });

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too Many Requests',
            error: 'Rate limit exceeded',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await this.incrementCount(key, windowMs);
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // If Redis is unavailable, allow the request (fail open)
      this.logger.error('Rate limiter Redis error, allowing request', {
        error: error.message,
        clientIp,
      });
      return true;
    }
  }

  private getClientIp(request: any): string {
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.connection?.socket?.remoteAddress ||
      'unknown'
    );
  }

  private async getCurrentCount(key: string): Promise<number> {
    const redis = this.redisService.getClient();
    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  private async incrementCount(key: string, windowMs: number): Promise<void> {
    const redis = this.redisService.getClient();

    // Use Redis MULTI to atomically increment and set expiration
    const multi = redis.multi();
    multi.incr(key);
    multi.pexpire(key, windowMs);

    await multi.exec();
  }
}


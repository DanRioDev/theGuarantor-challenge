import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => {
        try {
          await this.redisClient.ping();
          return {
            redis: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            redis: {
              status: 'down',
              error: (error as Error).message,
            },
          };
        }
      },
    ]);
  }
}

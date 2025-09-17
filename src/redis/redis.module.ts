import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CachingService } from './caching.service';

@Global()
@Module({
  providers: [
    RedisService,
    CachingService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (redisService: RedisService) => redisService.getClient(),
      inject: [RedisService],
    },
  ],
  exports: [RedisService, CachingService, 'REDIS_CLIENT'],
})
export class RedisModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { ProvidersModule } from './providers/providers.module';
import { ValidateAddressController } from './validate-address.controller';
import { ResponseTransformationService } from './services/response-transformation.service';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
      LoggerModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TerminusModule,
    HealthModule,
    RedisModule,
    ProvidersModule,
  ],
  controllers: [AppController, ValidateAddressController],
  providers: [AppService, ResponseTransformationService],
})
export class AppModule {}

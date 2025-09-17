import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { AddressValidationModule } from './modules/address-validation/address-validation.module';
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
    AddressValidationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

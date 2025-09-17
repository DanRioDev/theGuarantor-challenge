import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AddressValidationController } from './address-validation.controller';
import { CachingService } from './services/caching.service';
import { ResponseTransformationService } from './services/response-transformation.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { AddressValidationProvider } from './providers/address-validation.provider';
import { MockAddressValidationProvider } from './providers/mock-address-validation.provider';
import { SmartyStreetsAddressValidationProvider } from './providers/smarty-streets-address-validation.provider';

@Module({
  imports: [ConfigModule],
  controllers: [AddressValidationController],
  providers: [
    CachingService,
    ResponseTransformationService,
    CircuitBreakerService,
    MockAddressValidationProvider,
    SmartyStreetsAddressValidationProvider,
    {
      provide: 'AddressValidationProvider',
      useFactory: (
        configService: ConfigService,
        mockProvider: MockAddressValidationProvider,
        smartyProvider: SmartyStreetsAddressValidationProvider,
      ) => {
        const authId = configService.get<string>('SMARTY_AUTH_ID');
        const authToken = configService.get<string>('SMARTY_AUTH_TOKEN');

        if (authId && authToken) {
          return smartyProvider;
        } else {
          return mockProvider;
        }
      },
      inject: [
        ConfigService,
        MockAddressValidationProvider,
        SmartyStreetsAddressValidationProvider,
      ],
    },
  ],
  exports: ['AddressValidationProvider'],
})
export class AddressValidationModule {}


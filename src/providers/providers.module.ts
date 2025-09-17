import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MockAddressValidationProvider } from './mock-address-validation.provider';
import { SmartyStreetsAddressValidationProvider } from './smarty-streets-address-validation.provider';
import { CircuitBreakerService } from '../services/circuit-breaker.service';

@Module({
  imports: [ConfigModule],
  providers: [
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
export class ProvidersModule {}

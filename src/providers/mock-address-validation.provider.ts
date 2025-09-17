import { Injectable } from '@nestjs/common';
import {
  AddressValidationProvider,
  ValidationResult,
} from '../modules/address-validation/providers/address-validation.provider';

@Injectable()
export class MockAddressValidationProvider implements AddressValidationProvider {
  async validateAddress(address: string): Promise<ValidationResult> {
    return {
      status: 'valid',
      inputAddress: address,
      standardizedAddress: {
        streetNumber: '1600',
        streetName: 'Pennsylvania',
        streetSuffix: 'Ave',
        city: 'Washington',
        state: 'DC',
        zipCode: '20500',
        zipPlus4: '0003',
      },
      rawResponse: { mock: true },
    };
  }
}


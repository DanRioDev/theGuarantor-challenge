import { Injectable } from '@nestjs/common';
import {
  AddressValidationProvider,
  ValidationResult,
  StandardizedAddress,
} from './address-validation.provider';

@Injectable()
export class MockAddressValidationProvider
  implements AddressValidationProvider
{
  async validateAddress(address: string): Promise<ValidationResult> {
    // Mock implementation for testing
    // Business rule: Simulate real provider behavior for development

    const mockAddress: StandardizedAddress = {
      streetNumber: '1600',
      streetName: 'Pennsylvania',
      streetSuffix: 'Ave',
      city: 'Washington',
      state: 'DC',
      zipCode: '20500',
      zipPlus4: '0003',
    };

    return {
      status: 'valid',
      inputAddress: address,
      standardizedAddress: mockAddress,
      rawResponse: { mock: true },
    };
  }
}

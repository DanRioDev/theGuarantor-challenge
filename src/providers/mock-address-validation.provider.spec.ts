import { Test, TestingModule } from '@nestjs/testing';
import { MockAddressValidationProvider } from './mock-address-validation.provider';

describe('MockAddressValidationProvider', () => {
  let provider: MockAddressValidationProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockAddressValidationProvider],
    }).compile();

    provider = module.get<MockAddressValidationProvider>(
      MockAddressValidationProvider,
    );
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('validateAddress', () => {
    it('should return a valid mock result for any input', async () => {
      const testAddress = '123 Main St, Anytown, ST 12345';

      const result = await provider.validateAddress(testAddress);

      expect(result).toEqual({
        status: 'valid',
        inputAddress: testAddress,
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
      });
    });

    it('should handle empty address input', async () => {
      const result = await provider.validateAddress('');

      expect(result.status).toBe('valid');
      expect(result.inputAddress).toBe('');
      expect(result.standardizedAddress).toBeDefined();
    });

    it('should handle special characters in address', async () => {
      const specialAddress = '123 Main St., Apt #4B, Test City, TX 12345-6789';

      const result = await provider.validateAddress(specialAddress);

      expect(result.status).toBe('valid');
      expect(result.inputAddress).toBe(specialAddress);
      expect(result.standardizedAddress).toBeDefined();
    });

    it('should always return the same standardized address', async () => {
      const address1 = 'Different Address 1';
      const address2 = 'Different Address 2';

      const result1 = await provider.validateAddress(address1);
      const result2 = await provider.validateAddress(address2);

      expect(result1.standardizedAddress).toEqual(result2.standardizedAddress);
    });
  });
});

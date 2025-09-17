import { Test, TestingModule } from '@nestjs/testing';
import { ResponseTransformationService } from './response-transformation.service';
import {
  ValidationResult,
  StandardizedAddress,
} from '../providers/address-validation.provider';

describe('ResponseTransformationService', () => {
  let service: ResponseTransformationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseTransformationService],
    }).compile();

    service = module.get<ResponseTransformationService>(
      ResponseTransformationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transformValidationResult', () => {
    it('should transform valid result correctly', () => {
      const inputResult: ValidationResult = {
        status: 'valid',
        inputAddress: '1600 Pennsylvania Ave, Washington, DC 20500',
        standardizedAddress: {
          streetNumber: '1600',
          streetName: 'Pennsylvania',
          streetSuffix: 'Ave',
          city: 'Washington',
          state: 'DC',
          zipCode: '20500',
          zipPlus4: '0003',
        },
      };

      const result = service.transformValidationResult(inputResult);

      expect(result).toEqual({
        status: 'valid',
        inputAddress: '1600 Pennsylvania Ave, Washington, DC 20500',
        standardizedAddress: '1600 Pennsylvania Ave, Washington, DC 20500-0003',
        details: {
          streetNumber: '1600',
          streetName: 'Pennsylvania',
          streetSuffix: 'Ave',
          city: 'Washington',
          state: 'DC',
          zipCode: '20500',
          zipPlus4: '0003',
        },
      });
    });

    it('should transform corrected result correctly', () => {
      const inputResult: ValidationResult = {
        status: 'corrected',
        inputAddress: '1600 pennsylvania ave, washington, dc 20500',
        standardizedAddress: {
          streetNumber: '1600',
          streetName: 'Pennsylvania',
          streetSuffix: 'Ave',
          city: 'Washington',
          state: 'DC',
          zipCode: '20500',
          zipPlus4: '0003',
        },
      };

      const result = service.transformValidationResult(inputResult);

      expect(result).toEqual({
        status: 'corrected',
        inputAddress: '1600 pennsylvania ave, washington, dc 20500',
        standardizedAddress: '1600 Pennsylvania Ave, Washington, DC 20500-0003',
        originalInput: '1600 pennsylvania ave, washington, dc 20500',
        details: {
          streetNumber: '1600',
          streetName: 'Pennsylvania',
          streetSuffix: 'Ave',
          city: 'Washington',
          state: 'DC',
          zipCode: '20500',
          zipPlus4: '0003',
        },
      });
    });

    it('should transform unverifiable result correctly', () => {
      const inputResult: ValidationResult = {
        status: 'unverifiable',
        inputAddress: 'Invalid Address 123',
        standardizedAddress: null,
      };

      const result = service.transformValidationResult(inputResult);

      expect(result).toEqual({
        status: 'unverifiable',
        inputAddress: 'Invalid Address 123',
        error: 'Address could not be verified',
      });
    });

    it('should handle missing secondary address components', () => {
      const inputResult: ValidationResult = {
        status: 'valid',
        inputAddress: '123 Main St, Springfield, IL 62701',
        standardizedAddress: {
          streetNumber: '123',
          streetName: 'Main',
          streetSuffix: 'St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          zipPlus4: '1234',
        },
      };

      const result = service.transformValidationResult(inputResult);

      expect(result.details).not.toHaveProperty('secondaryDesignator');
      expect(result.details).not.toHaveProperty('secondaryNumber');
    });

    it('should include secondary address components when present', () => {
      const inputResult: ValidationResult = {
        status: 'valid',
        inputAddress: '123 Main St Apt 4B, Springfield, IL 62701',
        standardizedAddress: {
          streetNumber: '123',
          streetName: 'Main',
          streetSuffix: 'St',
          secondaryDesignator: 'Apt',
          secondaryNumber: '4B',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          zipPlus4: '1234',
        },
      };

      const result = service.transformValidationResult(inputResult);

      expect(result.details.secondaryDesignator).toBe('Apt');
      expect(result.details.secondaryNumber).toBe('4B');
      expect(result.standardizedAddress).toBe(
        '123 Main St Apt 4B, Springfield, IL 62701-1234',
      );
    });
  });

  describe('formatStandardizedAddress', () => {
    it('should format basic address correctly', () => {
      const address: StandardizedAddress = {
        streetNumber: '123',
        streetName: 'Main',
        streetSuffix: 'St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        zipPlus4: '1234',
      };

      const result = service.formatStandardizedAddress(address);
      expect(result).toBe('123 Main St, Springfield, IL 62701-1234');
    });

    it('should format address with secondary components', () => {
      const address: StandardizedAddress = {
        streetNumber: '123',
        streetName: 'Main',
        streetSuffix: 'St',
        secondaryDesignator: 'Apt',
        secondaryNumber: '4B',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        zipPlus4: '1234',
      };

      const result = service.formatStandardizedAddress(address);
      expect(result).toBe('123 Main St Apt 4B, Springfield, IL 62701-1234');
    });

    it('should handle missing zipPlus4', () => {
      const address: StandardizedAddress = {
        streetNumber: '123',
        streetName: 'Main',
        streetSuffix: 'St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        zipPlus4: '', // Empty zipPlus4
      };

      const result = service.formatStandardizedAddress(address);
      expect(result).toBe('123 Main St, Springfield, IL 62701');
    });
  });
});

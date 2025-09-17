import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmartyStreetsAddressValidationProvider } from './smarty-streets-address-validation.provider';

// Mock axios at the module level
jest.mock('axios', () => ({
  create: jest.fn(),
}));

import axios from 'axios';

describe('SmartyStreetsAddressValidationProvider', () => {
  let provider: SmartyStreetsAddressValidationProvider;
  let configService: ConfigService;
  let mockHttpClient: any;

  const mockAuthId = 'test-auth-id';
  const mockAuthToken = 'test-auth-token';

  beforeEach(async () => {
    mockHttpClient = { get: jest.fn() };
    (axios.create as jest.Mock).mockReturnValue(mockHttpClient);

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'SMARTY_AUTH_ID') return mockAuthId;
        if (key === 'SMARTY_AUTH_TOKEN') return mockAuthToken;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartyStreetsAddressValidationProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<SmartyStreetsAddressValidationProvider>(
      SmartyStreetsAddressValidationProvider,
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAddress', () => {
    const mockAddress = '123 Main St, Springfield, IL 62701';

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttpClient.get.mockClear();
    });

    it('should return valid result for successful API response', async () => {
      const mockApiResponse = [
        {
          components: {
            primary_number: '123',
            street_name: 'Main',
            street_suffix: 'St',
            city_name: 'Springfield',
            state_abbreviation: 'IL',
            zipcode: '62701',
            plus4_code: '1234',
          },
        },
      ];

      mockHttpClient.get.mockResolvedValue({ data: mockApiResponse });

      const result = await provider.validateAddress(mockAddress);

      expect(result.status).toBe('valid');
      expect(result.inputAddress).toBe(mockAddress);
      expect(result.standardizedAddress).toEqual({
        streetNumber: '123',
        streetName: 'Main',
        streetSuffix: 'St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        zipPlus4: '1234',
      });
    });

    it('should return corrected result when address differs from input', async () => {
      const mockApiResponse = [
        {
          components: {
            primary_number: '123',
            street_name: 'Main',
            street_suffix: 'Street', // Different from input 'St'
            city_name: 'Springfield',
            state_abbreviation: 'IL',
            zipcode: '62701',
            plus4_code: '1234',
          },
        },
      ];

      mockHttpClient.get.mockResolvedValue({ data: mockApiResponse });

      const result = await provider.validateAddress(
        '123 Main St, Springfield, IL 62701',
      );

      expect(result.status).toBe('corrected');
      expect(result.standardizedAddress).toBeDefined();
    });

    it('should return unverifiable result when no candidates found', async () => {
      mockHttpClient.get.mockResolvedValue({ data: [] });

      const result = await provider.validateAddress(mockAddress);

      expect(result.status).toBe('unverifiable');
      expect(result.inputAddress).toBe(mockAddress);
      expect(result.standardizedAddress).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const mockError = { response: { data: 'error data' } };
      mockHttpClient.get.mockRejectedValue(mockError);

      const result = await provider.validateAddress(mockAddress);

      expect(result.status).toBe('unverifiable');
      expect(result.inputAddress).toBe(mockAddress);
      expect(result.standardizedAddress).toBeNull();
      expect(result.rawResponse).toBeUndefined(); // Error response should not be exposed
    });

    it('should parse address components correctly', async () => {
      const mockApiResponse = [
        {
          components: {
            primary_number: '1600',
            street_name: 'Pennsylvania',
            street_suffix: 'Ave',
            secondary_designator: 'Apt',
            secondary_number: '4B',
            city_name: 'Washington',
            state_abbreviation: 'DC',
            zipcode: '20500',
            plus4_code: '0003',
          },
        },
      ];

      mockHttpClient.get.mockResolvedValue({ data: mockApiResponse });

      const result = await provider.validateAddress(mockAddress);

      expect(result.standardizedAddress).toEqual({
        streetNumber: '1600',
        streetName: 'Pennsylvania',
        streetSuffix: 'Ave',
        secondaryDesignator: 'Apt',
        secondaryNumber: '4B',
        city: 'Washington',
        state: 'DC',
        zipCode: '20500',
        zipPlus4: '0003',
      });
    });

    it('should make correct API call with parsed address components', async () => {
      mockHttpClient.get.mockResolvedValue({ data: [] });

      await provider.validateAddress('123 Main St, Springfield, IL 62701');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/street-address', {
        params: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipcode: '62701',
        },
      });
    });
  });

  describe('parseAddress', () => {
    it('should parse complete address correctly', () => {
      const address = '123 Main St, Springfield, IL 62701';
      const result = (provider as any).parseAddress(address);

      expect(result).toEqual({
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      });
    });

    it('should handle addresses without zip code', () => {
      const address = '123 Main St, Springfield, IL';
      const result = (provider as any).parseAddress(address);

      expect(result).toEqual({
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '',
      });
    });

    it('should handle addresses with extra whitespace', () => {
      const address = '  123 Main St  ,  Springfield  ,  IL  62701  ';
      const result = (provider as any).parseAddress(address);

      expect(result).toEqual({
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      });
    });
  });

  describe('isExactMatch', () => {
    it('should return true for exact matches', () => {
      const input = {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      };

      const candidate = {
        components: {
          primary_number: '123',
          street_name: 'Main',
          street_suffix: 'St',
          city_name: 'Springfield',
          state_abbreviation: 'IL',
          zipcode: '62701',
        },
      };

      const result = (provider as any).isExactMatch(input, candidate);
      expect(result).toBe(true);
    });

    it('should return false for non-exact matches', () => {
      const input = {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      };

      const candidate = {
        components: {
          primary_number: '124', // Different number
          street_name: 'Main',
          street_suffix: 'St',
          city_name: 'Springfield',
          state_abbreviation: 'IL',
          zipcode: '62701',
        },
      };

      const result = (provider as any).isExactMatch(input, candidate);
      expect(result).toBe(false);
    });
  });
});

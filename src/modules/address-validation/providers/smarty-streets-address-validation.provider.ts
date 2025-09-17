import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  AddressValidationProvider,
  ValidationResult,
  StandardizedAddress,
} from './address-validation.provider';
import { CircuitBreakerService } from '../services/circuit-breaker.service';

@Injectable()
export class SmartyStreetsAddressValidationProvider
  implements AddressValidationProvider
{
  private readonly logger = new Logger(
    SmartyStreetsAddressValidationProvider.name,
  );
  private readonly httpClient: AxiosInstance;
  private readonly validateWithCircuitBreaker: (address: string) => Promise<ValidationResult>;

  constructor(
    private configService: ConfigService,
    private circuitBreakerService: CircuitBreakerService,
  ) {
    const authId = this.configService.get<string>('SMARTY_AUTH_ID');
    const authToken = this.configService.get<string>('SMARTY_AUTH_TOKEN');

    if (!authId || !authToken) {
      throw new Error(
        'SMARTY_AUTH_ID and SMARTY_AUTH_TOKEN must be configured',
      );
    }

    this.httpClient = axios.create({
      baseURL: 'https://api.smartystreets.com',
      timeout: 5000, // 5 second timeout
      params: {
        'auth-id': authId,
        'auth-token': authToken,
      },
    });

    // Create circuit breaker for the validateAddress operation
    this.validateWithCircuitBreaker = this.circuitBreakerService.createCircuitBreaker(
      'SmartyStreetsValidation',
      this.performValidation.bind(this),
      {
        timeout: 10000, // 10 seconds
        errorThresholdPercentage: 50,
        resetTimeout: 30000, // 30 seconds
      },
    );
  }

  async validateAddress(address: string): Promise<ValidationResult> {
    return this.validateWithCircuitBreaker(address);
  }

  private async performValidation(address: string): Promise<ValidationResult> {
    try {
      // Parse input address into components
      const addressComponents = this.parseAddress(address);

      const response = await this.httpClient.get('/street-address', {
        params: {
          street: addressComponents.street,
          city: addressComponents.city,
          state: addressComponents.state,
          zipcode: addressComponents.zipCode,
        },
      });

      const candidates = response.data;

      if (!candidates || candidates.length === 0) {
        return {
          status: 'unverifiable',
          inputAddress: address,
          standardizedAddress: null,
          rawResponse: response.data,
        };
      }

      // Select the first (highest confidence) candidate
      const bestCandidate = candidates[0];

      // Check if it's an exact match or corrected
      const isExactMatch = this.isExactMatch(addressComponents, bestCandidate);

      const standardizedAddress: StandardizedAddress = {
        streetNumber: bestCandidate.components.primary_number,
        streetName: bestCandidate.components.street_name,
        streetSuffix: bestCandidate.components.street_suffix,
        secondaryDesignator: bestCandidate.components.secondary_designator,
        secondaryNumber: bestCandidate.components.secondary_number,
        city: bestCandidate.components.city_name,
        state: bestCandidate.components.state_abbreviation,
        zipCode: bestCandidate.components.zipcode,
        zipPlus4: bestCandidate.components.plus4_code,
      };

      return {
        status: isExactMatch ? 'valid' : 'corrected',
        inputAddress: address,
        standardizedAddress,
        rawResponse: response.data,
      };
    } catch (error) {
      this.logger.error(
        `Address validation failed: ${error.message}`,
        error.stack,
      );
      return {
        status: 'unverifiable',
        inputAddress: address,
        standardizedAddress: null,
        rawResponse: undefined,
      };
    }
  }

  private parseAddress(address: string): {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  } {
    // Simple parsing - in production, might use a more robust parser
    const parts = address.split(',').map((p) => p.trim());

    let street = '';
    let city = '';
    let state = '';
    let zipCode = '';

    if (parts.length >= 1) street = parts[0];
    if (parts.length >= 2) city = parts[1];
    if (parts.length >= 3) {
      const stateZip = parts[2].split(' ');
      state = stateZip[0];
      zipCode = stateZip.slice(1).join(' ').trim();
    }

    return { street, city, state, zipCode };
  }

  private isExactMatch(input: any, candidate: any): boolean {
    // Simple exact match logic - compare key components
    return (
      input.street.toLowerCase() ===
        `${candidate.components.primary_number} ${candidate.components.street_name} ${candidate.components.street_suffix}`.toLowerCase() &&
      input.city.toLowerCase() ===
        candidate.components.city_name.toLowerCase() &&
      input.state.toLowerCase() ===
        candidate.components.state_abbreviation.toLowerCase() &&
      input.zipCode === candidate.components.zipcode
    );
  }
}

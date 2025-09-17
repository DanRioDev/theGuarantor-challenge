import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  AddressValidationProvider,
  ValidationResult,
  StandardizedAddress,
} from '../modules/address-validation/providers/address-validation.provider';

interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface SmartyCandidate {
  components: {
    primary_number: string;
    street_name: string;
    street_suffix: string;
    secondary_designator?: string;
    secondary_number?: string;
    city_name: string;
    state_abbreviation: string;
    zipcode: string;
    plus4_code: string;
  };
}

@Injectable()
export class SmartyStreetsAddressValidationProvider implements AddressValidationProvider {
  private readonly logger = new Logger(SmartyStreetsAddressValidationProvider.name);
  private readonly httpClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    const authId = this.configService.get<string>('SMARTY_AUTH_ID');
    const authToken = this.configService.get<string>('SMARTY_AUTH_TOKEN');

    this.httpClient = axios.create({
      baseURL: 'https://us-street.api.smartystreets.com',
      params: {
        'auth-id': authId,
        'auth-token': authToken,
      },
    });
  }

  async validateAddress(address: string): Promise<ValidationResult> {
    try {
      const parsedAddress = this.parseAddress(address);

      const response = await this.httpClient.get('/street-address', {
        params: {
          street: parsedAddress.street,
          city: parsedAddress.city,
          state: parsedAddress.state,
          zipcode: parsedAddress.zipCode,
        },
      });

      const candidates: SmartyCandidate[] = response.data;

      if (!candidates || candidates.length === 0) {
        return {
          status: 'unverifiable',
          inputAddress: address,
          standardizedAddress: null,
        };
      }

      const candidate = candidates[0];
      const standardizedAddress = this.mapToStandardizedAddress(candidate.components);

      const isExact = this.isExactMatch(parsedAddress, candidate);

      return {
        status: isExact ? 'valid' : 'corrected',
        inputAddress: address,
        standardizedAddress,
        rawResponse: candidates,
      };
    } catch (error) {
      this.logger.error(`Address validation failed for: ${address}`, error.message);
      return {
        status: 'unverifiable',
        inputAddress: address,
        standardizedAddress: null,
      };
    }
  }

  private parseAddress(address: string): ParsedAddress {
    const trimmed = address.trim();
    const parts = trimmed.split(',').map(p => p.trim());

    if (parts.length < 3) {
      // Assume street, city state zip
      const street = parts[0] || '';
      const cityStateZip = parts[1] || '';
      const cityStateZipParts = cityStateZip.split(' ');
      const state = cityStateZipParts.pop() || '';
      const zipCode = cityStateZipParts.pop() || '';
      const city = cityStateZipParts.join(' ');

      return { street, city, state, zipCode };
    }

    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2].split(' ');
    const state = stateZip[0];
    const zipCode = stateZip[1] || '';

    return { street, city, state, zipCode };
  }

  private mapToStandardizedAddress(components: SmartyCandidate['components']): StandardizedAddress {
    return {
      streetNumber: components.primary_number,
      streetName: components.street_name,
      streetSuffix: components.street_suffix,
      secondaryDesignator: components.secondary_designator,
      secondaryNumber: components.secondary_number,
      city: components.city_name,
      state: components.state_abbreviation,
      zipCode: components.zipcode,
      zipPlus4: components.plus4_code,
    };
  }

  private isExactMatch(parsed: ParsedAddress, candidate: SmartyCandidate): boolean {
    // Simple exact match check - in real implementation, might need more sophisticated logic
    const candidateStreet = `${candidate.components.primary_number} ${candidate.components.street_name} ${candidate.components.street_suffix}`;
    return (
      candidateStreet.toLowerCase().includes(parsed.street.toLowerCase()) &&
      candidate.components.city_name.toLowerCase() === parsed.city.toLowerCase() &&
      candidate.components.state_abbreviation === parsed.state &&
      candidate.components.zipcode === parsed.zipCode
    );
  }
}


import { Injectable } from '@nestjs/common';
import {
  ValidationResult,
  StandardizedAddress,
} from '../providers/address-validation.provider';

export interface TransformedValidationResponse {
  status: 'valid' | 'corrected' | 'unverifiable';
  inputAddress: string;
  standardizedAddress?: string;
  originalInput?: string;
  error?: string;
  details?: {
    streetNumber: string;
    streetName: string;
    streetSuffix: string;
    secondaryDesignator?: string;
    secondaryNumber?: string;
    city: string;
    state: string;
    zipCode: string;
    zipPlus4: string;
  };
}

@Injectable()
export class ResponseTransformationService {
  /**
   * Transforms internal ValidationResult to external API response format.
   *
   * Business rule: Standardize API responses for consistent client experience.
   * Include human-readable formatted address and detailed component breakdown.
   */
  transformValidationResult(
    result: ValidationResult,
  ): TransformedValidationResponse {
    switch (result.status) {
      case 'valid':
        return {
          status: 'valid',
          inputAddress: result.inputAddress,
          standardizedAddress: this.formatStandardizedAddress(
            result.standardizedAddress!,
          ),
          details: this.mapStandardizedAddressToDetails(
            result.standardizedAddress!,
          ),
        };

      case 'corrected':
        return {
          status: 'corrected',
          inputAddress: result.inputAddress, // Keep original input
          standardizedAddress: this.formatStandardizedAddress(
            result.standardizedAddress!,
          ),
          originalInput: result.inputAddress,
          details: this.mapStandardizedAddressToDetails(
            result.standardizedAddress!,
          ),
        };

      case 'unverifiable':
        return {
          status: 'unverifiable',
          inputAddress: result.inputAddress,
          error: 'Address could not be verified',
        };

      default:
        throw new Error(`Unknown validation status: ${result.status}`);
    }
  }

  /**
   * Formats StandardizedAddress into human-readable string.
   *
   * Business rule: Create consistent, readable address format for API responses.
   * Include all available components in logical order.
   */
  formatStandardizedAddress(address: StandardizedAddress): string {
    const streetParts = [
      `${address.streetNumber} ${address.streetName} ${address.streetSuffix}`,
    ];

    if (address.secondaryDesignator && address.secondaryNumber) {
      streetParts.push(
        `${address.secondaryDesignator} ${address.secondaryNumber}`,
      );
    }

    const streetAddress = streetParts.join(' ');
    const cityStateZip = `${address.city}, ${address.state} ${address.zipCode}`;

    if (address.zipPlus4) {
      return `${streetAddress}, ${cityStateZip}-${address.zipPlus4}`;
    }

    return `${streetAddress}, ${cityStateZip}`;
  }

  /**
   * Maps StandardizedAddress to details object for API response.
   *
   * Business rule: Provide detailed address components while excluding
   * null/undefined values for cleaner API responses.
   */
  private mapStandardizedAddressToDetails(address: StandardizedAddress): any {
    const details: any = {
      streetNumber: address.streetNumber,
      streetName: address.streetName,
      streetSuffix: address.streetSuffix,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      zipPlus4: address.zipPlus4,
    };

    // Only include secondary components if they exist
    if (address.secondaryDesignator) {
      details.secondaryDesignator = address.secondaryDesignator;
    }
    if (address.secondaryNumber) {
      details.secondaryNumber = address.secondaryNumber;
    }

    return details;
  }
}

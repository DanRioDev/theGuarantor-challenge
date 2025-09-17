// Business rule: This interface abstracts the address validation provider
// to prevent vendor lock-in and enable easy testing
export interface AddressValidationProvider {
  validateAddress(address: string): Promise<ValidationResult>;
}

export interface ValidationResult {
  status: 'valid' | 'corrected' | 'unverifiable';
  inputAddress: string;
  standardizedAddress: StandardizedAddress | null;
  rawResponse?: any; // For debugging and logging
}

export interface StandardizedAddress {
  streetNumber: string;
  streetName: string;
  streetSuffix: string;
  secondaryDesignator?: string;
  secondaryNumber?: string;
  city: string;
  state: string;
  zipCode: string;
  zipPlus4: string;
}

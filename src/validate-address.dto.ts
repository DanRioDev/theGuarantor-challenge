import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

const MIN_ADDRESS_LENGTH = 5;
const MAX_ADDRESS_LENGTH = 500;
const INVALID_CHARS_REGEX = /^[^<>&\"']*$/;


export class ValidateAddressDto {
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address cannot be empty' })
  @Length(MIN_ADDRESS_LENGTH, MAX_ADDRESS_LENGTH, { message: `Address must be between ${MIN_ADDRESS_LENGTH} and ${MAX_ADDRESS_LENGTH} characters` })
  @Matches(INVALID_CHARS_REGEX, {
    message: 'Address contains invalid characters (<, >, &, ", \')'
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Trim whitespace and normalize spaces
      return value.trim().replace(/\s+/g, ' ');
    }
    return value;
  })
  address: string;
}

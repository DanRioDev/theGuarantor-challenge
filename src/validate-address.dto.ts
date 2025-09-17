import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class ValidateAddressDto {
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address cannot be empty' })
  @Length(5, 500, { message: 'Address must be between 5 and 500 characters' })
  @Matches(/^[^<>&"']*$/, {
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

import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ValidateAddressDto } from './dto/validate-address.dto';
import type { AddressValidationProvider } from './providers/address-validation.provider';
import { CachingService } from './services/caching.service';
import { ResponseTransformationService } from './services/response-transformation.service';
import { RateLimiterGuard } from '../../common/rate-limiter.guard';

@Controller('api/v1')
export class AddressValidationController {
  constructor(
    @Inject('AddressValidationProvider')
    private readonly provider: AddressValidationProvider,
    private readonly cachingService: CachingService,
    private readonly responseTransformationService: ResponseTransformationService,
  ) {}

  @Post('validate-address')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimiterGuard)
  async validateAddress(@Body() dto: ValidateAddressDto) {
    // Business rule: Implement cache-aside pattern for performance and cost optimization

    // Check cache first
    const cachedResult = await this.cachingService.getCachedValidationResult(
      dto.address,
    );
    if (cachedResult) {
      return this.responseTransformationService.transformValidationResult(
        cachedResult,
      );
    }

    // Cache miss - validate with provider
    const validationResult = await this.provider.validateAddress(dto.address);

    // Cache the result
    await this.cachingService.setCachedValidationResult(
      dto.address,
      validationResult,
    );

    // Transform and return response
    return this.responseTransformationService.transformValidationResult(
      validationResult,
    );
  }
}

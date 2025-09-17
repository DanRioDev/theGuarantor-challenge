import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { normalizeAddress } from '../../../utils/address-normalization.util';
import { ValidationResult } from '../providers/address-validation.provider';
import { ErrorHandler } from '../../../utils/error-handling.util';
import { CACHE_PREFIX, DEFAULT_TTL, UNVERIFIABLE_TTL } from '../../../constants';

@Injectable()
export class CachingService {
  private readonly logger = new Logger(CachingService.name);

  constructor(private redisService: RedisService) {}

  /**
   * Retrieves a cached validation result for the given address.
   *
   * Business rule: Use normalized address as cache key for consistency.
   * Returns null if no cached result exists or if deserialization fails.
   */
  async getCachedValidationResult(
    address: string,
  ): Promise<ValidationResult | null> {
    const cacheKey = this.generateCacheKey(address);

    return ErrorHandler.safeExecute(
      async () => {
        const client = this.redisService.getClient();
        const cachedData = await client.get(cacheKey);
        if (!cachedData) {
          return null;
        }

        const result = JSON.parse(cachedData) as ValidationResult;
        this.logger.debug(`Cache hit for address: ${address}`);
        return result;
      },
      this.logger,
      `Retrieving cached result for ${address}`,
      null,
    );
  }

  /**
   * Caches a validation result for the given address.
   *
   * Business rule: Use different TTL for unverifiable results to allow
   * for potential future validation. Cache successful validations longer
   * to maximize cost savings and performance.
   */
  async setCachedValidationResult(
    address: string,
    result: ValidationResult,
    customTtl?: number,
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(address);

    // Determine TTL based on result status
    const ttl =
      customTtl ||
      (result.status === 'unverifiable'
        ? UNVERIFIABLE_TTL
        : DEFAULT_TTL);

    await ErrorHandler.safeExecute(
      async () => {
        const client = this.redisService.getClient();
        await client.set(cacheKey, JSON.stringify(result), 'EX', ttl);
        this.logger.debug(
          `Cached validation result for ${address} with TTL ${ttl}s`,
        );
      },
      this.logger,
      `Caching result for ${address}`,
    );
  }

  /**
   * Invalidates the cache for a specific address.
   *
   * Business rule: Allow manual cache invalidation for address corrections
   * or when address data needs to be refreshed.
   */
  async invalidateCache(address: string): Promise<void> {
    const cacheKey = this.generateCacheKey(address);

    await ErrorHandler.safeExecute(
      async () => {
        const client = this.redisService.getClient();
        await client.del(cacheKey);
        this.logger.debug(`Invalidated cache for address: ${address}`);
      },
      this.logger,
      `Invalidating cache for ${address}`,
    );
  }

  /**
   * Generates a consistent cache key for an address.
   *
   * Business rule: Normalize addresses to ensure cache hits regardless
   * of minor formatting differences.
   */
  generateCacheKey(address: string): string {
    const normalized = normalizeAddress(address);
    return `${CACHE_PREFIX}${normalized}`;
  }
}

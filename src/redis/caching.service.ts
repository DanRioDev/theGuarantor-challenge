import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { normalizeAddress } from '../utils/address-normalization.util';
import { ValidationResult } from '../providers/address-validation.provider';

@Injectable()
export class CachingService {
  private readonly logger = new Logger(CachingService.name);
  private readonly CACHE_PREFIX = 'address:';
  private readonly DEFAULT_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly UNVERIFIABLE_TTL = 1 * 60 * 60; // 1 hour for unverifiable results

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
    const client = this.redisService.getClient();

    try {
      const cachedData = await client.get(cacheKey);
      if (!cachedData) {
        return null;
      }

      const result = JSON.parse(cachedData) as ValidationResult;
      this.logger.debug(`Cache hit for address: ${address}`);
      return result;
    } catch (error) {
      this.logger.warn(
        `Failed to retrieve cached result for ${address}: ${error.message}`,
      );
      return null;
    }
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
    const client = this.redisService.getClient();

    // Determine TTL based on result status
    const ttl =
      customTtl ||
      (result.status === 'unverifiable'
        ? this.UNVERIFIABLE_TTL
        : this.DEFAULT_TTL);

    try {
      await client.set(cacheKey, JSON.stringify(result), 'EX', ttl);
      this.logger.debug(
        `Cached validation result for ${address} with TTL ${ttl}s`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cache result for ${address}: ${error.message}`,
      );
      // Don't throw - caching failures shouldn't break validation
    }
  }

  /**
   * Invalidates the cache for a specific address.
   *
   * Business rule: Allow manual cache invalidation for address corrections
   * or when address data needs to be refreshed.
   */
  async invalidateCache(address: string): Promise<void> {
    const cacheKey = this.generateCacheKey(address);
    const client = this.redisService.getClient();

    try {
      await client.del(cacheKey);
      this.logger.debug(`Invalidated cache for address: ${address}`);
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate cache for ${address}: ${error.message}`,
      );
    }
  }

  /**
   * Generates a consistent cache key for an address.
   *
   * Business rule: Normalize addresses to ensure cache hits regardless
   * of minor formatting differences.
   */
  generateCacheKey(address: string): string {
    const normalized = normalizeAddress(address);
    return `${this.CACHE_PREFIX}${normalized}`;
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { CachingService } from './caching.service';
import { RedisService } from './redis.service';
import { normalizeAddress } from '../utils/address-normalization.util';

describe('CachingService', () => {
  let service: CachingService;
  let redisService: RedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue(redisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CachingService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<CachingService>(CachingService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCachedValidationResult', () => {
    it('should return cached result when available', async () => {
      const address = '123 Main St, Springfield, IL 62701';
      const normalizedKey = normalizeAddress(address);
      const cachedResult = { status: 'valid', inputAddress: address };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await service.getCachedValidationResult(address);

      expect(result).toEqual(cachedResult);
      expect(redisClient.get).toHaveBeenCalledWith(`address:${normalizedKey}`);
    });

    it('should return null when no cached result exists', async () => {
      const address = '123 Main St, Springfield, IL 62701';

      redisClient.get.mockResolvedValue(null);

      const result = await service.getCachedValidationResult(address);

      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const address = '123 Main St, Springfield, IL 62701';

      redisClient.get.mockResolvedValue('invalid json');

      const result = await service.getCachedValidationResult(address);

      expect(result).toBeNull();
    });
  });

  describe('setCachedValidationResult', () => {
    it('should cache validation result with default TTL', async () => {
      const address = '123 Main St, Springfield, IL 62701';
      const normalizedKey = normalizeAddress(address);
      const result = { status: 'valid', inputAddress: address };

      redisClient.set.mockResolvedValue('OK');

      await service.setCachedValidationResult(address, result);

      expect(redisClient.set).toHaveBeenCalledWith(
        `address:${normalizedKey}`,
        JSON.stringify(result),
        'EX',
        2592000, // 30 days in seconds
      );
    });

    it('should cache validation result with custom TTL', async () => {
      const address = '123 Main St, Springfield, IL 62701';
      const result = { status: 'valid', inputAddress: address };
      const customTtl = 3600; // 1 hour

      await service.setCachedValidationResult(address, result, customTtl);

      expect(redisClient.set).toHaveBeenCalledWith(
        `address:${normalizeAddress(address)}`,
        JSON.stringify(result),
        'EX',
        customTtl,
      );
    });

    it('should handle unverifiable results with shorter TTL', async () => {
      const address = 'Invalid Address';
      const result = { status: 'unverifiable', inputAddress: address };

      await service.setCachedValidationResult(address, result);

      expect(redisClient.set).toHaveBeenCalledWith(
        `address:${normalizeAddress(address)}`,
        JSON.stringify(result),
        'EX',
        3600, // 1 hour for unverifiable
      );
    });
  });

  describe('invalidateCache', () => {
    it('should delete cached result for address', async () => {
      const address = '123 Main St, Springfield, IL 62701';
      const normalizedKey = normalizeAddress(address);

      redisClient.del.mockResolvedValue(1);

      await service.invalidateCache(address);

      expect(redisClient.del).toHaveBeenCalledWith(`address:${normalizedKey}`);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const address1 = '123 Main St, Springfield, IL 62701';
      const address2 = '123 MAIN ST, SPRINGFIELD, IL 62701';
      const address3 = '  123 Main St  , Springfield , IL 62701  ';

      const key1 = service.generateCacheKey(address1);
      const key2 = service.generateCacheKey(address2);
      const key3 = service.generateCacheKey(address3);

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
      expect(key1).toMatch(/^address:/);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import { AddressValidationProvider } from './providers/address-validation.provider';
import { ValidationResult } from './providers/address-validation.provider';
import { MockAddressValidationProvider } from './providers/mock-address-validation.provider';

jest.setTimeout(60000);

describe('ValidateAddressController (integration)', () => {
  let app: INestApplication;
  let mockProvider: jest.Mocked<AddressValidationProvider>;

  beforeAll(async () => {
    // Set Redis configuration for integration tests
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6380';

    const mockValidationResult: ValidationResult = {
      status: 'valid',
      inputAddress: '123 Main St, Springfield, IL 62701',
      standardizedAddress: {
        streetNumber: '123',
        streetName: 'Main',
        streetSuffix: 'St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        zipPlus4: '1234',
      },
      rawResponse: { mock: true },
    };

    mockProvider = {
      validateAddress: jest.fn().mockResolvedValue(mockValidationResult),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('AddressValidationProvider')
      .useValue(mockProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should validate address and return transformed response', () => {
    const inputAddress = '123 Main St, Springfield, IL 62701';

    return request(app.getHttpServer())
      .post('/api/v1/validate-address')
      .send({ address: inputAddress })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'valid');
        expect(res.body).toHaveProperty('inputAddress', inputAddress);
        expect(res.body).toHaveProperty('standardizedAddress');
        expect(res.body.standardizedAddress).toHaveProperty('streetNumber', '123');
        expect(res.body).toHaveProperty('standardizedAddress');
      });
  });

  it('should cache validation results', async () => {
    const inputAddress = '123 Main St, Springfield, IL 62701';

    // First request
    await request(app.getHttpServer())
      .post('/api/v1/validate-address')
      .send({ address: inputAddress })
      .expect(200);

    // Second request should use cache
    await request(app.getHttpServer())
      .post('/api/v1/validate-address')
      .send({ address: inputAddress })
      .expect(200);

    // Provider should only be called once due to caching
    expect(mockProvider.validateAddress).toHaveBeenCalledTimes(1);
  });

  it('should handle provider errors gracefully', () => {
    mockProvider.validateAddress.mockRejectedValueOnce(new Error('Provider error'));

    return request(app.getHttpServer())
      .post('/api/v1/validate-address')
      .send({ address: 'invalid address' })
      .expect(500); // Should return 500 on error
  });
});


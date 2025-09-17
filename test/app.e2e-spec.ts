import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AddressValidationProvider } from './../src/providers/address-validation.provider';
import { ValidationResult } from './../src/providers/address-validation.provider';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let mockProvider: jest.Mocked<AddressValidationProvider>;

  beforeEach(async () => {
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/v1/validate-address (POST) should validate address', () => {
    const inputAddress = '123 Main St, Springfield, IL 62701';

    return request(app.getHttpServer())
      .post('/api/v1/validate-address')
      .send({ address: inputAddress })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'valid');
        expect(res.body).toHaveProperty('inputAddress', inputAddress);
        expect(res.body).toHaveProperty('standardizedAddress');
      });
  });

  it('/api/v1/validate-address (POST) should handle invalid input', () => {
    return request(app.getHttpServer())
      .post('/api/v1/validate-address')
      .send({ address: '' })
      .expect(400);
  });

  it('/health (GET) should return health status', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body.status).toBe('ok');
      });
  });
});

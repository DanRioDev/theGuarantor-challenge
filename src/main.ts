import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Use Pino for structured JSON logging
    logger: false, // Disable default logger, will be replaced by Pino
  });

  // Use Pino logger globally
  app.useLogger(app.get(Logger));

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS for API access
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Use structured logging instead of console.log
  const logger = app.get(Logger);
  logger.log(`Application is running on: http://localhost:${port}`);
}
try {
  bootstrap();
} catch (error) {
  console.error('Bootstrap error:', error);
  process.exit(1);
}

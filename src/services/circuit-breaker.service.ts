import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();

  createCircuitBreaker<T extends any[], R>(
    name: string,
    fn: (...args: T) => Promise<R>,
    options: CircuitBreaker.Options = {},
  ): (...args: T) => Promise<R> {
    const defaultOptions: CircuitBreaker.Options = {
      timeout: 10000, // 10 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30 seconds
      ...options,
    };

    const breaker = new CircuitBreaker(fn, defaultOptions);

    breaker.on('open', () => {
      this.logger.warn(`Circuit breaker "${name}" opened - switching to fallback mode`);
    });

    breaker.on('close', () => {
      this.logger.log(`Circuit breaker "${name}" closed - service restored`);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit breaker "${name}" half-open - testing service recovery`);
    });

    breaker.on('fallback', (result) => {
      this.logger.warn(`Circuit breaker "${name}" fallback triggered`, { result });
    });

    this.circuitBreakers.set(name, breaker);

    return breaker.fire.bind(breaker);
  }

  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  async getStats(name: string) {
    const breaker = this.circuitBreakers.get(name);
    if (breaker) {
      return breaker.stats;
    }
    return null;
  }
}


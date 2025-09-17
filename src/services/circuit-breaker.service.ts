import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private failureCount = 0;
  private lastFailureTime?: Date;
  private readonly failureThreshold = 5; // Number of failures before opening
  private readonly timeoutMs = 60000; // 1 minute timeout

  isOpen(): boolean {
    if (this.failureCount < this.failureThreshold) {
      return false;
    }

    if (!this.lastFailureTime) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    if (timeSinceLastFailure > this.timeoutMs) {
      // Reset after timeout
      this.failureCount = 0;
      return false;
    }

    return true;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = undefined;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.logger.warn(`Circuit breaker failure recorded. Count: ${this.failureCount}`);
  }
}


import { Logger } from '@nestjs/common';

/**
 * Common error handling utilities to reduce duplication across services
 */
export class ErrorHandler {
  /**
   * Safely executes an async operation and returns null on failure
   * Used for non-critical operations like caching
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    logger: Logger,
    context: string,
    defaultValue: T = null as T,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.warn(`${context} failed: ${(error as Error).message}`);
      return defaultValue;
    }
  }

  /**
   * Safely executes an async operation and returns default value on failure
   * Used for operations that should always return a valid result
   */
  static async safeExecuteWithDefault<T>(
    operation: () => Promise<T>,
    logger: Logger,
    context: string,
    defaultValue: T,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.error(`${context} failed: ${(error as Error).message}`, (error as Error).stack);
      return defaultValue;
    }
  }

  /**
   * Logs an error with consistent formatting
   */
  static logError(logger: Logger, context: string, error: unknown, additionalData?: Record<string, any>) {
    const errorObj = error as Error;
    logger.error(`${context}: ${errorObj.message}`, {
      stack: errorObj.stack,
      ...additionalData,
    });
  }

  /**
   * Logs a warning with consistent formatting
   */
  static logWarning(logger: Logger, context: string, error: unknown, additionalData?: Record<string, any>) {
    const errorObj = error as Error;
    logger.warn(`${context}: ${errorObj.message}`, additionalData);
  }
}


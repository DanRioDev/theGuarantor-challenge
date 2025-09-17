// Application-wide constants

// Address validation constants
export const MIN_ADDRESS_LENGTH = 5;
export const MAX_ADDRESS_LENGTH = 500;
export const INVALID_CHARS_REGEX = /^[^<>&\\\"']*$/;

// Caching constants
export const CACHE_PREFIX = 'address:';
export const DEFAULT_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
export const UNVERIFIABLE_TTL = 1 * 60 * 60; // 1 hour for unverifiable results

// Default port
export const DEFAULT_PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : 3000;


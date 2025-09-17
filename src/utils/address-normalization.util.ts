/**
 * Normalizes an address string for consistent caching and comparison.
 *
 * Business rule: Address normalization ensures deterministic cache keys
 * by converting to lowercase, trimming whitespace, and normalizing spaces.
 * This prevents cache misses due to minor formatting differences.
 */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/,/g, ' ') // Replace all commas with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

import { normalizeAddress } from './address-normalization.util';

describe('AddressNormalizationUtil', () => {
  describe('normalizeAddress', () => {
    it('should normalize lowercase input', () => {
      const input = '123 MAIN ST, SPRINGFIELD, IL 62701';
      const expected = '123 main st springfield il 62701';
      expect(normalizeAddress(input)).toBe(expected);
    });

    it('should trim whitespace', () => {
      const input = '  123 Main St  , Springfield , IL 62701  ';
      const expected = '123 main st springfield il 62701';
      expect(normalizeAddress(input)).toBe(expected);
    });

    it('should normalize multiple spaces to single spaces', () => {
      const input = '123  Main   St,   Springfield,  IL    62701';
      const expected = '123 main st springfield il 62701';
      expect(normalizeAddress(input)).toBe(expected);
    });

    it('should handle addresses with apartment numbers', () => {
      const input = '123 Main St Apt 4B, Springfield, IL 62701';
      const expected = '123 main st apt 4b springfield il 62701';
      expect(normalizeAddress(input)).toBe(expected);
    });

    it('should handle PO Box addresses', () => {
      const input = 'PO BOX 123, Springfield, IL 62701';
      const expected = 'po box 123 springfield il 62701';
      expect(normalizeAddress(input)).toBe(expected);
    });

    it('should handle empty input', () => {
      expect(normalizeAddress('')).toBe('');
      expect(normalizeAddress('   ')).toBe('');
    });

    it('should be deterministic - same input produces same output', () => {
      const input = '123 MAIN ST, Springfield, IL 62701';
      const result1 = normalizeAddress(input);
      const result2 = normalizeAddress(input);
      expect(result1).toBe(result2);
    });

    it('should handle special characters consistently', () => {
      const input = '123 Main St., Springfield, IL 62701';
      const expected = '123 main st. springfield il 62701';
      expect(normalizeAddress(input)).toBe(expected);
    });

    it('should handle different case variations', () => {
      const inputs = [
        '123 main st, springfield, il 62701',
        '123 MAIN ST, SPRINGFIELD, IL 62701',
        '123 Main St, Springfield, Il 62701',
      ];
      const expected = '123 main st springfield il 62701';
      inputs.forEach((input) => {
        expect(normalizeAddress(input)).toBe(expected);
      });
    });
  });
});

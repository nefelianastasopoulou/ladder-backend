import { getFormattedFirstName } from '../../lib/utils';

describe('Utility Functions', () => {
  describe('getFormattedFirstName', () => {
    it('should return the first name from full name', () => {
      expect(getFormattedFirstName('John Doe')).toBe('John');
      expect(getFormattedFirstName('Mary Jane Smith')).toBe('Mary');
      expect(getFormattedFirstName('José María García')).toBe('José');
    });

    it('should handle single names', () => {
      expect(getFormattedFirstName('John')).toBe('John');
      expect(getFormattedFirstName('Madonna')).toBe('Madonna');
    });

    it('should handle empty or whitespace names', () => {
      expect(getFormattedFirstName('')).toBe('');
      expect(getFormattedFirstName('   ')).toBe('');
    });

    it('should handle names with extra spaces', () => {
      expect(getFormattedFirstName('  John   Doe  ')).toBe('John');
      expect(getFormattedFirstName('  Mary   Jane   Smith  ')).toBe('Mary');
    });
  });
});

import {
  safeDate,
  safeFormatDate,
  safeFormatDateTime,
  safeFormatTime,
  isValidDate,
  getSafeDate,
  DEFAULT_DATE_OPTIONS,
  DEFAULT_DATETIME_OPTIONS,
  DEFAULT_TIME_OPTIONS
} from '@/lib/utils/safe-date';

describe('Safe Date Utilities', () => {
  const validDateString = '2024-01-15T10:30:00Z';
  const invalidDateString = 'invalid-date';
  const validDate = new Date('2024-01-15T10:30:00Z');

  describe('safeDate', () => {
    it('should handle valid date strings', () => {
      const result = safeDate(validDateString);
      expect(result.isValid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.formatted).toBe(validDate.toISOString());
    });

    it('should handle valid Date objects', () => {
      const result = safeDate(validDate);
      expect(result.isValid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.formatted).toBe(validDate.toISOString());
    });

    it('should handle invalid date strings', () => {
      const result = safeDate(invalidDateString);
      expect(result.isValid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.formatted).toBe('Invalid date');
    });

    it('should handle null input', () => {
      const result = safeDate(null);
      expect(result.isValid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.formatted).toBe('No date');
    });

    it('should handle undefined input', () => {
      const result = safeDate(undefined);
      expect(result.isValid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.formatted).toBe('No date');
    });
  });

  describe('safeFormatDate', () => {
    it('should format valid dates', () => {
      const result = safeFormatDate(validDateString);
      expect(result).toBe('1/15/2024');
    });

    it('should return fallback for invalid dates', () => {
      const result = safeFormatDate(invalidDateString);
      expect(result).toBe('No date');
    });

    it('should use custom fallback', () => {
      const result = safeFormatDate(null, undefined, 'Custom fallback');
      expect(result).toBe('Custom fallback');
    });

    it('should handle custom options', () => {
      const result = safeFormatDate(validDateString, { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      expect(result).toBe('01/15/2024');
    });
  });

  describe('safeFormatDateTime', () => {
    it('should format valid dates with time', () => {
      const result = safeFormatDateTime(validDateString);
      expect(result).toContain('2024');
      expect(result).toContain('1/15');
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should return fallback for invalid dates', () => {
      const result = safeFormatDateTime(invalidDateString);
      expect(result).toBe('No date');
    });

    it('should use custom fallback', () => {
      const result = safeFormatDateTime(null, undefined, 'Custom fallback');
      expect(result).toBe('Custom fallback');
    });
  });

  describe('safeFormatTime', () => {
    it('should format valid dates as time', () => {
      const result = safeFormatTime(validDateString);
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should return fallback for invalid dates', () => {
      const result = safeFormatTime(invalidDateString);
      expect(result).toBe('No time');
    });

    it('should use custom fallback', () => {
      const result = safeFormatTime(null, undefined, 'Custom fallback');
      expect(result).toBe('Custom fallback');
    });

    it('should handle custom time options', () => {
      const result = safeFormatTime(validDateString, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(validDateString)).toBe(true);
      expect(isValidDate(validDate)).toBe(true);
      expect(isValidDate(Date.now())).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(invalidDateString)).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });
  });

  describe('getSafeDate', () => {
    it('should return Date object for valid dates', () => {
      const result = getSafeDate(validDateString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(validDate.getTime());
    });

    it('should return null for invalid dates', () => {
      expect(getSafeDate(invalidDateString)).toBeNull();
      expect(getSafeDate(null)).toBeNull();
      expect(getSafeDate(undefined)).toBeNull();
    });
  });

  describe('Default options', () => {
    it('should have correct default date options', () => {
      expect(DEFAULT_DATE_OPTIONS).toEqual({
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    });

    it('should have correct default datetime options', () => {
      expect(DEFAULT_DATETIME_OPTIONS).toEqual({
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    it('should have correct default time options', () => {
      expect(DEFAULT_TIME_OPTIONS).toEqual({
        hour: '2-digit',
        minute: '2-digit'
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle extreme dates', () => {
      const extremeDate = '1900-01-01T00:00:00Z';
      expect(isValidDate(extremeDate)).toBe(true);
      expect(safeFormatDate(extremeDate)).toBeTruthy();
    });

    it('should handle leap year dates', () => {
      const leapDate = '2024-02-29T12:00:00Z';
      expect(isValidDate(leapDate)).toBe(true);
      expect(safeFormatDate(leapDate)).toBeTruthy();
    });

    it('should handle timezone variations', () => {
      const dates = [
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00+05:30',
        '2024-01-15T10:30:00-08:00'
      ];
      
      dates.forEach(date => {
        expect(isValidDate(date)).toBe(true);
        expect(safeFormatDate(date)).toBeTruthy();
      });
    });

    it('should gracefully handle formatting errors', () => {
      // Mock toLocaleDateString to throw an error
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = jest.fn().mockImplementation(() => {
        throw new Error('Formatting error');
      });

      const result = safeFormatDate(validDateString);
      expect(result).toBe('No date');

      // Restore original method
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });
  });
});
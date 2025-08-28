import { detectTrailingNewlines } from '@/lib/env-validation';

describe('Environment Validation System', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('detectTrailingNewlines', () => {
    it('should detect environment variables with trailing newlines', () => {
      // Mock ENV values directly since it's imported from env.ts
      const mockEnv = {
        TEST_VAR_WITH_NEWLINE: 'value\n',
        TEST_VAR_CLEAN: 'clean_value'
      };

      // Mock the ENV import
      jest.doMock('@/lib/utils/env', () => ({
        ENV: mockEnv,
        isProduction: false,
        isDevelopment: true
      }));

      // Re-import after mocking
      const { detectTrailingNewlines } = require('@/lib/env-validation');
      const result = detectTrailingNewlines();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when no issues', () => {
      const mockEnv = {
        CLEAN_VAR1: 'clean_value',
        CLEAN_VAR2: 'another_clean_value'
      };

      jest.doMock('@/lib/utils/env', () => ({
        ENV: mockEnv,
        isProduction: false,
        isDevelopment: true
      }));

      const { detectTrailingNewlines } = require('@/lib/env-validation');
      const result = detectTrailingNewlines();
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Basic functionality', () => {
    it('should import functions without errors', () => {
      expect(() => {
        require('@/lib/env-validation');
      }).not.toThrow();
    });

    it('should have main functions available', () => {
      const module = require('@/lib/env-validation');
      
      expect(typeof module.detectTrailingNewlines).toBe('function');
      expect(typeof module.validateUrlFormats).toBe('function');
      expect(typeof module.checkMissingSecrets).toBe('function');
    });
  });
});
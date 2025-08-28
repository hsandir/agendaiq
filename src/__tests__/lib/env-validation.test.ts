import {
  detectTrailingNewlines,
  validateUrlFormats,
  checkMissingSecrets,
  getEnvironmentReport,
  validateEnvironment,
  getEnvironmentSuggestions
} from '@/lib/env-validation';

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
      process.env.TEST_VAR_WITH_NEWLINE = 'value\n';
      process.env.TEST_VAR_CLEAN = 'clean_value';
      
      const result = detectTrailingNewlines();
      
      expect(result).toContain('TEST_VAR_WITH_NEWLINE');
      expect(result).not.toContain('TEST_VAR_CLEAN');
    });

    it('should handle multiple newline types', () => {
      process.env.UNIX_NEWLINE = 'value\n';
      process.env.WINDOWS_NEWLINE = 'value\r\n';
      process.env.MULTIPLE_NEWLINES = 'value\n\n';
      
      const result = detectTrailingNewlines();
      
      expect(result).toContain('UNIX_NEWLINE');
      expect(result).toContain('WINDOWS_NEWLINE');
      expect(result).toContain('MULTIPLE_NEWLINES');
    });

    it('should return empty array when no trailing newlines found', () => {
      process.env.CLEAN_VAR1 = 'clean_value';
      process.env.CLEAN_VAR2 = 'another_clean_value';
      
      const result = detectTrailingNewlines();
      
      expect(result).toHaveLength(0);
    });
  });

  describe('validateUrlFormats', () => {
    it('should detect malformed database URLs', () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost/db\n';
      
      const result = validateUrlFormats();
      
      expect(result).toHaveProperty('DATABASE_URL');
      expect(result.DATABASE_URL).toContain('trailing newline');
    });

    it('should detect malformed NextAuth URLs', () => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000\n';
      
      const result = detectMalformedUrls();
      
      expect(result).toHaveProperty('NEXTAUTH_URL');
      expect(result.NEXTAUTH_URL).toContain('trailing newline');
    });

    it('should detect invalid URL formats', () => {
      process.env.DATABASE_URL = 'not-a-valid-url';
      
      const result = detectMalformedUrls();
      
      expect(result).toHaveProperty('DATABASE_URL');
      expect(result.DATABASE_URL).toContain('Invalid URL format');
    });

    it('should validate clean URLs as correct', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      
      const result = detectMalformedUrls();
      
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should enforce HTTPS for production NextAuth URL', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXTAUTH_URL = 'http://example.com';
      
      const result = detectMalformedUrls();
      
      expect(result).toHaveProperty('NEXTAUTH_URL');
      expect(result.NEXTAUTH_URL).toContain('HTTPS required in production');
    });
  });

  describe('detectMissingSecrets', () => {
    it('should detect missing required secrets', () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.DATABASE_URL;
      
      const result = detectMissingSecrets();
      
      expect(result).toContain('NEXTAUTH_SECRET');
      expect(result).toContain('DATABASE_URL');
    });

    it('should detect production-specific missing secrets', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      
      const result = detectMissingSecrets();
      
      expect(result).toContain('GOOGLE_CLIENT_ID');
      expect(result).toContain('GOOGLE_CLIENT_SECRET');
    });

    it('should not require production secrets in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      
      const result = detectMissingSecrets();
      
      expect(result).not.toContain('GOOGLE_CLIENT_ID');
      expect(result).not.toContain('GOOGLE_CLIENT_SECRET');
    });

    it('should return empty array when all secrets are present', () => {
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      
      const result = detectMissingSecrets();
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getEnvironmentReport', () => {
    it('should generate comprehensive environment report', () => {
      process.env.NEXTAUTH_SECRET = 'secret\n';
      process.env.DATABASE_URL = 'invalid-url';
      delete process.env.NEXTAUTH_URL;
      
      const report = getEnvironmentReport();
      
      expect(report).toHaveProperty('trailingNewlines');
      expect(report).toHaveProperty('malformedUrls');
      expect(report).toHaveProperty('missingSecrets');
      expect(report).toHaveProperty('suggestions');
      expect(report).toHaveProperty('summary');
      
      expect(report.trailingNewlines).toContain('NEXTAUTH_SECRET');
      expect(report.malformedUrls).toHaveProperty('DATABASE_URL');
      expect(report.missingSecrets).toContain('NEXTAUTH_URL');
    });

    it('should generate clean report for valid environment', () => {
      process.env.NEXTAUTH_SECRET = 'clean_secret';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      
      const report = getEnvironmentReport();
      
      expect(report.trailingNewlines).toHaveLength(0);
      expect(Object.keys(report.malformedUrls)).toHaveLength(0);
      expect(report.missingSecrets).toHaveLength(0);
      expect(report.summary.hasIssues).toBe(false);
    });

    it('should calculate correct issue counts', () => {
      process.env.VAR1 = 'value\n';
      process.env.VAR2 = 'value\n';
      process.env.DATABASE_URL = 'invalid';
      delete process.env.NEXTAUTH_SECRET;
      
      const report = getEnvironmentReport();
      
      expect(report.summary.totalIssues).toBe(4); // 2 newlines + 1 malformed + 1 missing
      expect(report.summary.hasIssues).toBe(true);
    });
  });

  describe('validateProductionEnvironment', () => {
    it('should validate production environment successfully', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXTAUTH_SECRET = 'production_secret';
      process.env.DATABASE_URL = 'postgresql://prod-server/db';
      process.env.NEXTAUTH_URL = 'https://myapp.com';
      process.env.GOOGLE_CLIENT_ID = 'google_id';
      process.env.GOOGLE_CLIENT_SECRET = 'google_secret';
      
      const result = validateProductionEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with missing production requirements', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXTAUTH_URL = 'http://insecure.com'; // HTTP in production
      delete process.env.GOOGLE_CLIENT_ID;
      
      const result = validateProductionEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should be more lenient in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      
      const result = validateProductionEnvironment();
      
      // Should not fail for missing optional dev secrets
      expect(result.isValid).toBe(true);
    });
  });

  describe('generateEnvironmentSuggestions', () => {
    it('should generate helpful suggestions for common issues', () => {
      process.env.NEXTAUTH_SECRET = 'secret\n';
      process.env.DATABASE_URL = 'invalid-url';
      
      const suggestions = generateEnvironmentSuggestions();
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('trailing newline'))).toBe(true);
      expect(suggestions.some(s => s.includes('DATABASE_URL'))).toBe(true);
    });

    it('should provide no suggestions for clean environment', () => {
      process.env.NEXTAUTH_SECRET = 'clean_secret';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      
      const suggestions = generateEnvironmentSuggestions();
      
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined environment variables gracefully', () => {
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_URL;
      delete process.env.NEXTAUTH_SECRET;
      
      expect(() => {
        detectTrailingNewlines();
        detectMalformedUrls();
        detectMissingSecrets();
        getEnvironmentReport();
      }).not.toThrow();
    });

    it('should handle empty string environment variables', () => {
      process.env.EMPTY_VAR = '';
      
      const newlineResult = detectTrailingNewlines();
      const urlResult = detectMalformedUrls();
      
      expect(newlineResult).not.toContain('EMPTY_VAR');
      expect(urlResult).not.toHaveProperty('EMPTY_VAR');
    });

    it('should handle very long environment variable values', () => {
      const longValue = 'a'.repeat(10000) + '\n';
      process.env.LONG_VAR = longValue;
      
      const result = detectTrailingNewlines();
      
      expect(result).toContain('LONG_VAR');
    });
  });
});
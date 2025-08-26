// Enhanced Environment Variable Validation System
// Zero Degradation Protocol compliant

import { ENV, isProduction, isDevelopment } from '@/lib/utils/env';

export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  trailingNewlines: string[];
  malformedUrls: string[];
  missingSecrets: string[];
}

// Detect trailing newlines in environment variables
export function detectTrailingNewlines(): string[] {
  const varsWithNewlines: string[] = [];
  
  Object.entries(ENV).forEach(([key, value]) => {
    if (value && typeof value === 'string' && value.includes('\n')) {
      varsWithNewlines.push(key);
    }
  });
  
  return varsWithNewlines;
}

// Validate URL formats
export function validateUrlFormats(): string[] {
  const malformedUrls: string[] = [];
  
  // Check NEXTAUTH_URL format
  if (ENV.NEXTAUTH_URL) {
    try {
      const url = new URL(ENV.NEXTAUTH_URL);
      if (isProduction && url.protocol !== 'https:') {
        malformedUrls.push('NEXTAUTH_URL must use HTTPS in production');
      }
    } catch {
      malformedUrls.push('NEXTAUTH_URL is not a valid URL');
    }
  }
  
  // Check DATABASE_URL format
  if (ENV.DATABASE_URL) {
    try {
      const url = new URL(ENV.DATABASE_URL);
      
      // Check for malformed username (should not contain dots in postgres user)
      if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
        if (url.username && url.username.includes('.') && !url.username.startsWith('postgres')) {
          malformedUrls.push('DATABASE_URL username appears malformed (contains unexpected dots)');
        }
      }
      
      // Check for special characters that need encoding
      if (url.password && /[^a-zA-Z0-9_\-]/.test(url.password)) {
        const needsEncoding = /[%&=\s]/.test(url.password);
        if (needsEncoding) {
          malformedUrls.push('DATABASE_URL password contains special characters that may need URL encoding');
        }
      }
    } catch {
      malformedUrls.push('DATABASE_URL is not a valid URL');
    }
  }
  
  return malformedUrls;
}

// Check for missing secrets
export function checkMissingSecrets(): string[] {
  const missingSecrets: string[] = [];
  
  // Required secrets
  const requiredSecrets = [
    { key: 'NEXTAUTH_SECRET', name: 'NextAuth Secret' },
    { key: 'DATABASE_URL', name: 'Database URL' },
  ];
  
  requiredSecrets.forEach(({ key, name }) => {
    const value = ENV[key as keyof typeof ENV];
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      missingSecrets.push(`${name} (${key}) is missing or empty`);
    }
  });
  
  // Production-only secrets
  if (isProduction) {
    const productionSecrets = [
      { key: 'GOOGLE_CLIENT_ID', name: 'Google Client ID' },
      { key: 'GOOGLE_CLIENT_SECRET', name: 'Google Client Secret' },
    ];
    
    productionSecrets.forEach(({ key, name }) => {
      const value = ENV[key as keyof typeof ENV];
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        missingSecrets.push(`${name} (${key}) is required in production`);
      }
    });
  }
  
  return missingSecrets;
}

// Comprehensive environment validation
export function validateEnvironment(): EnvironmentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for trailing newlines
  const trailingNewlines = detectTrailingNewlines();
  if (trailingNewlines.length > 0) {
    const errorMsg = `Environment variables with trailing newlines: ${trailingNewlines.join(', ')}`;
    if (isProduction) {
      errors.push(errorMsg);
    } else {
      warnings.push(errorMsg);
    }
  }
  
  // Validate URL formats
  const malformedUrls = validateUrlFormats();
  malformedUrls.forEach(msg => {
    if (isProduction) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  });
  
  // Check missing secrets
  const missingSecrets = checkMissingSecrets();
  missingSecrets.forEach(msg => {
    if (isProduction) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    trailingNewlines,
    malformedUrls,
    missingSecrets
  };
}

// Auto-fix environment variables (where possible)
export function autoFixEnvironment(): { fixed: string[]; unfixable: string[] } {
  const fixed: string[] = [];
  const unfixable: string[] = [];
  
  // Note: We can't actually fix environment variables at runtime
  // This function provides guidance on what needs manual fixing
  
  const trailingNewlines = detectTrailingNewlines();
  trailingNewlines.forEach(varName => {
    unfixable.push(`${varName}: Remove trailing newlines manually via deployment platform`);
  });
  
  const malformedUrls = validateUrlFormats();
  malformedUrls.forEach(msg => {
    unfixable.push(`URL Format: ${msg}`);
  });
  
  const missingSecrets = checkMissingSecrets();
  missingSecrets.forEach(msg => {
    unfixable.push(`Secret: ${msg}`);
  });
  
  return { fixed, unfixable };
}

// Runtime environment assertion with Zero Degradation Protocol
export function assertEnvironment(): void {
  const validation = validateEnvironment();
  
  // Always log warnings
  if (validation.warnings.length > 0) {
    console.warn('🟡 Environment Validation Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  // Handle errors based on environment
  if (!validation.isValid) {
    console.error('🔴 Environment Validation Failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (isProduction) {
      throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    } else {
      console.error('⚠️  Environment issues detected. System will continue with fallbacks.');
    }
  } else if (isDevelopment) {
    console.log('✅ Environment validation passed');
  }
}

// Get detailed environment report
export function getEnvironmentReport(): {
  environment: string;
  validation: EnvironmentValidationResult;
  config: {
    hasDatabase: boolean;
    hasAuth: boolean;
    hasEmail: boolean;
    hasGoogleAuth: boolean;
  };
  suggestions: string[];
} {
  const validation = validateEnvironment();
  const { fixed, unfixable } = autoFixEnvironment();
  
  return {
    environment: ENV.NODE_ENV,
    validation,
    config: {
      hasDatabase: !!ENV.DATABASE_URL,
      hasAuth: !!ENV.NEXTAUTH_SECRET,
      hasEmail: !!ENV.RESEND_API_KEY,
      hasGoogleAuth: !!(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET),
    },
    suggestions: [
      ...unfixable,
      ...(validation.warnings.length > 0 ? ['Review warnings before production deployment'] : []),
      ...(isDevelopment ? ['Run validation again before production deployment'] : [])
    ]
  };
}

// Initialize validation on module load (server-side only)
if (typeof window === 'undefined') {
  console.log('🔍 Environment Validation System initialized');
  assertEnvironment();
}
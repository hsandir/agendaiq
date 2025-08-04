// Environment utilities for AgendaIQ

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
} as const;

export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';
export const isTest = ENV.NODE_ENV === 'test';

// Feature flags based on environment
export const FEATURES = {
  // Development tools only in development
  enableDevTools: isDevelopment,
  enableMockDataTracker: isDevelopment,
  enableDatabaseManagement: isDevelopment,
  enableDependencyManager: isDevelopment,
  enableLintTools: isDevelopment,
  
  // Production features
  enablePerformanceMonitoring: isProduction,
  enableErrorTracking: isProduction,
  enableAnalytics: isProduction,
  enableSecurityHeaders: isProduction,
  
  // Universal features
  enableSystemHealth: true,
  enableServerMetrics: true,
  enableAlerts: true,
  enableSystemLogs: true,
  enableBackupManagement: true,
} as const;

// Configuration based on environment
export const CONFIG = {
  // Database
  database: {
    connectionPoolSize: isProduction ? 20 : 5,
    queryTimeout: isProduction ? 30000 : 10000,
    logQueries: isDevelopment,
  },
  
  // API
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 100 : 1000, // More restrictive in production
    },
    timeout: isProduction ? 30000 : 10000,
  },
  
  // Logging
  logging: {
    level: isDevelopment ? 'debug' : 'info',
    enableConsole: true,
    enableFile: isProduction,
    maxFileSize: '10MB',
    maxFiles: 5,
  },
  
  // Performance
  performance: {
    enableMonitoring: isProduction,
    slowQueryThreshold: isProduction ? 1000 : 2000,
    slowRouteThreshold: isProduction ? 2000 : 5000,
    monitoringInterval: 5 * 60 * 1000, // 5 minutes
  },
  
  // Security
  security: {
    enableCSP: isProduction,
    enableHSTS: isProduction,
    sessionMaxAge: isProduction ? 24 * 60 * 60 : 7 * 24 * 60 * 60, // 1 day prod, 7 days dev
  },
  
  // UI
  ui: {
    enableAnimations: !isTest,
    enableTooltips: true,
    enableKeyboardShortcuts: true,
  },
} as const;

// Environment validation
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required environment variables
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ] as const;
  
  for (const key of required) {
    if (!ENV[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }
  
  // Production-specific requirements
  if (isProduction) {
    const productionRequired = [
      'NEXTAUTH_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ] as const;
    
    for (const key of productionRequired) {
      if (!ENV[key]) {
        errors.push(`Missing required production environment variable: ${key}`);
      }
    }
    
    // Check NEXTAUTH_URL format
    if (ENV.NEXTAUTH_URL && !ENV.NEXTAUTH_URL.startsWith('https://')) {
      errors.push('NEXTAUTH_URL must use HTTPS in production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get environment info for debugging
export function getEnvironmentInfo() {
  return {
    environment: ENV.NODE_ENV,
    features: Object.entries(FEATURES)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    nextAuthUrl: ENV.NEXTAUTH_URL,
    hasDatabase: !!ENV.DATABASE_URL,
    hasGoogleAuth: !!(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET),
    hasEmailService: !!ENV.RESEND_API_KEY,
  };
}

// Runtime environment checks
export function assertEnvironment() {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (isProduction) {
      throw new Error('Invalid production environment configuration');
    }
  }
}

// Initialize environment on module load
if (typeof window === 'undefined') {
  // Server-side only
  assertEnvironment();
}
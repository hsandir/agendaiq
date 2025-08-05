import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Environments
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Performance Monitoring
  enableTracing: true,
  
  // Server specific settings
  autoSessionTracking: true,
  
  // Integrations
  integrations: [
    // Database monitoring will be added when needed
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Filter out specific errors in development
    if (process.env.NODE_ENV === 'development') {
      // Ignore hot reload errors
      if (hint.originalException?.message?.includes('ECONNREFUSED')) {
        return null;
      }
    }
    
    // Remove sensitive data
    if (event.request) {
      // Remove auth headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-auth-token'];
      }
      
      // Remove sensitive data from body
      if (event.request.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
        sensitiveFields.forEach(field => {
          if (event.request.data[field]) {
            event.request.data[field] = '[REDACTED]';
          }
        });
      }
    }
    
    // Add server context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'node',
        version: process.version,
      },
    };
    
    return event;
  },
  
  // Ignore specific errors
  ignoreErrors: [
    // Common false positives
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    // Ignore aborted requests
    'AbortError',
    'Request aborted',
  ],
  
  // Transaction sampling
  tracesSampler(samplingContext) {
    // Don't sample health checks
    if (samplingContext.request?.url?.includes('/api/health')) {
      return 0;
    }
    
    // Sample errors at 100%
    if (samplingContext.parentSampled) {
      return 1.0;
    }
    
    // Sample production at 10%, development at 100%
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  },
});
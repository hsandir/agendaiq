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
  
  // Edge specific settings
  transportOptions: {
    // Increase timeout for edge runtime
    fetchOptions: {
      keepalive: true,
    },
  },
  
  // Filtering
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    
    // Add edge context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'edge',
      },
    };
    
    return event;
  },
  
  // Ignore specific errors
  ignoreErrors: [
    // Edge runtime specific
    'FetchError',
    'EdgeRuntimeError',
  ],
});
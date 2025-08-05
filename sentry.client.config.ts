import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Replay settings for session recording
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  integrations: [
    // Automatically instrument your app's pageloads and navigations
    Sentry.replayIntegration({
      // Mask all text content, but keep media
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],
  
  // Environments
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Performance Monitoring
  enableTracing: true,
  
  // Filtering
  beforeSend(event, hint) {
    // Filter out specific errors in development
    if (process.env.NODE_ENV === 'development') {
      // Ignore ResizeObserver errors
      if (hint.originalException?.message?.includes('ResizeObserver')) {
        return null;
      }
    }
    
    // Remove sensitive data
    if (event.request) {
      // Remove auth headers
      if (event.request.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      
      // Remove sensitive query params
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        params.delete('token');
        params.delete('password');
        event.request.query_string = params.toString();
      }
    }
    
    return event;
  },
  
  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // Safari specific
    'Non-Error promise rejection captured',
    // React hydration errors (handle these separately)
    'Hydration failed',
    'There was an error while hydrating',
  ],
  
  // Only send errors from our domain
  allowUrls: [
    /https:\/\/(.+\.)?agendaiq\.com/,
    /http:\/\/localhost:3000/,
  ],
});
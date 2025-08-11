import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Export required hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NODE_ENV === 'production' ? SENTRY_DSN : undefined,
  
  // Lower sample rate in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Disable replays in development
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  
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
  
  // Filtering
  beforeSend(event, hint) {
    // Filter out specific errors in development
    if (process.env.NODE_ENV === 'development') {
      // Ignore ResizeObserver errors
      const error = hint.originalException as Error;
      if (error && error.message && error.message.includes('ResizeObserver')) {
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
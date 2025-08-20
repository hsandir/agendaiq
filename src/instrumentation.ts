// Sentry disabled - subscription expired
// import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Sentry disabled - subscription expired
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('../sentry.server.config');
  // }
  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('../sentry.edge.config');
  // }
}

export async function onRequestError(error: Error, request: Request, context: Record<string, unknown>) {
  // Log errors to console instead of Sentry
  console.error('Request error:', {
    error: error.message,
    url: request.url,
    context
  });
}
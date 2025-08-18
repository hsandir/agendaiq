import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side performance monitoring
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime specific setup
    await import('../sentry.edge.config');
  }
}

export async function onRequestError(error: Error, request: Request, context: Record<string, unknown>) {
  // Capture request errors with Sentry
  // @ts-ignore - Type mismatch between Next.js Request and Sentry RequestInfo
  Sentry.captureRequestError(error, request, context);
}
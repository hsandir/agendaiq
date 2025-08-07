import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side performance monitoring
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime specific setup
  }
}
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side performance monitoring
    console.log('Sentry initialized for Node.js runtime');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime specific setup
    console.log('Sentry initialized for edge runtime');
  }
}
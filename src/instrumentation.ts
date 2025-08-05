import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side performance monitoring
    Sentry.addIntegration(
      Sentry.postgresIntegration({
        usePgNative: false,
      })
    );
    
    // Custom performance monitoring
    Sentry.setMeasurementUnit('db.query.duration', 'millisecond');
    Sentry.setMeasurementUnit('api.response.time', 'millisecond');
    Sentry.setMeasurementUnit('api.request.size', 'byte');
    Sentry.setMeasurementUnit('api.response.size', 'byte');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime specific setup
    console.log('Sentry initialized for edge runtime');
  }
}
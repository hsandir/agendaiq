import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Enable experimental features if needed
  experimental: {
    // serverActions: true,
  },
  // Sentry error handling
  sentry: {
    // Upload source maps to Sentry
    hideSourceMaps: true,
    // Suppress Sentry SDK logs in production
    disableLogger: true,
    // Automatically tree shake Sentry logger statements
    autoInstrumentServerFunctions: true,
    // Tunnel route for bypassing ad blockers
    tunnelRoute: '/monitoring',
    // Automatically instrument app router
    autoInstrumentAppDirectory: true,
  },
};

// Sentry configuration wrapper
const sentryWebpackPluginOptions = {
  // Organization and project from your Sentry account
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Only upload source maps in production
  silent: true,
  
  // Upload source maps for production builds
  widenClientFileUpload: true,
  
  // Route prefixes to monitor
  reactComponentAnnotation: {
    enabled: true,
  },
  
  // Hide source maps from public access
  hideSourceMaps: true,
  
  // Disable Sentry CLI logs
  disableLogger: true,
};

// Export the config wrapped with Sentry
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
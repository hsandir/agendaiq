import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Modularize imports for better tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui/react-select': {
      transform: '@radix-ui/react-select',
    },
    '@radix-ui/react-dialog': {
      transform: '@radix-ui/react-dialog',
    },
    '@radix-ui/react-dropdown-menu': {
      transform: '@radix-ui/react-dropdown-menu',
    },
    '@radix-ui/react-popover': {
      transform: '@radix-ui/react-popover',
    },
    '@radix-ui/react-tabs': {
      transform: '@radix-ui/react-tabs',
    },
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns'],
    typedRoutes: true,
    clientTraceMetadata: ["baggage", "sentry-trace", "sentry-environment", "sentry-public_key", "sentry-release", "sentry-user_segment"],
  },
  
  // Temporarily disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Bundle analyzer for production builds
  bundlePagesRouterDependencies: true,
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ignore Prisma instrumentation warnings
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    
    return config;
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
  
  // Automatically tree shake Sentry logger statements
  autoInstrumentServerFunctions: true,
  
  // Tunnel route for bypassing ad blockers
  tunnelRoute: '/monitoring',
  
  // Automatically instrument app router
  autoInstrumentAppDirectory: true,
  
  // Automatically instrument middleware
  autoInstrumentMiddleware: true,
  
  // Disable telemetry to prevent connection issues
  telemetry: false,
  
  // Disable automatic error capture in development
  automaticVercelMonitors: false,
};

// Export the config wrapped with Sentry and Bundle Analyzer
export default withSentryConfig(bundleAnalyzer(nextConfig), sentryWebpackPluginOptions);
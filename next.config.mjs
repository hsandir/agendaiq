// TEMPORARILY DISABLED: Sentry subscription expired
// import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Ensure CSS is not removed
    styledComponents: false,
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
  
  // Typed Routes (disabled for build compatibility)
  // typedRoutes: true,
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'recharts', 'react-hook-form', '@hookform/resolvers'],
    // clientTraceMetadata disabled - Sentry subscription expired
    // optimizeCss: true, // Disabled - requires critters package
  },
  
  // External packages for server components
  serverExternalPackages: ['prisma', '@prisma/client'],
  
  // ESLint during build
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // TypeScript checks during build
  typescript: {
    ignoreBuildErrors: false,
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

  // PostHog rewrites for API and static assets
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/flags',
        destination: 'https://us.i.posthog.com/flags',
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // Bundle analyzer for production builds
  bundlePagesRouterDependencies: true,
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Enhanced code splitting for client bundles
      if (!dev) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            ...config.optimization.splitChunks,
            cacheGroups: {
              ...config.optimization.splitChunks.cacheGroups,
              // Separate vendor chunk for large libraries
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                chunks: 'all',
                minSize: 0,
              },
              // Separate chunk for UI components
              ui: {
                test: /[\\/]src[\\/]components[\\/](ui|teams|meetings)[\\/]/,
                name: 'ui-components',
                priority: 20,
                chunks: 'all',
                minSize: 10000,
              },
              // Charts and heavy components
              charts: {
                test: /[\\/](recharts|chart\.js|d3)[\\/]/,
                name: 'charts',
                priority: 30,
                chunks: 'all',
              },
            },
          },
        };
      }
    }
    
    // Add path alias resolution for @/ imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('./src', import.meta.url).pathname,
    };
    
    // Ignore Prisma instrumentation warnings
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    
    return config;
  },
};

// DISABLED: Sentry configuration (subscription expired)
/*
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
*/

// Export the config wrapped with Sentry and Bundle Analyzer
// TEMPORARILY DISABLED: Sentry subscription expired
// export default withSentryConfig(bundleAnalyzer(nextConfig), sentryWebpackPluginOptions);
export default bundleAnalyzer(nextConfig);
import dynamic from 'next/dynamic';
import React, { ComponentType, lazy } from 'react';

/**
 * Bundle Optimization Manager
 * 
 * Encapsulated performance optimization system:
 * - Dynamic component loading
 * - Code splitting utilities
 * - Bundle size monitoring
 */

interface LoadingComponentProps {
  className?: string;
}

// Default loading component
const DefaultLoadingComponent = ({ className = "" }: LoadingComponentProps) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
);

// Optimized dynamic imports for heavy components
export const DynamicComponents = {
  // Teams components (heavy due to complex UI)
  KnowledgeDetailModal: dynamic(
    () => import('@/components/teams/KnowledgeDetailModal'),
    {
      loading: () => <DefaultLoadingComponent className="min-h-[400px] p-4" />,
      ssr: false
    }
  ),
  
  EditKnowledgeDialog: dynamic(
    () => import('@/components/teams/EditKnowledgeDialog'),
    {
      loading: () => <DefaultLoadingComponent className="min-h-[300px] p-4" />,
      ssr: false
    }
  ),

  // Settings components (rarely used)
  AuditLogsClient: dynamic(
    () => import('@/components/audit/AuditLogsClient').then(mod => ({ default: mod.AuditLogsClient })),
    {
      loading: () => <DefaultLoadingComponent className="min-h-[500px] p-4" />,
      ssr: false
    }
  ),

  // Role management (admin only)
  RoleHierarchyVisualization: dynamic(
    () => import('@/components/settings/RoleHierarchyVisualization'),
    {
      loading: () => <DefaultLoadingComponent className="min-h-[600px] p-4" />,
      ssr: false
    }
  ),

  // Meeting components (heavy with agenda items)
  MeetingHistoryModal: dynamic(
    () => import('@/components/meetings/MeetingHistoryModal'),
    {
      loading: () => <DefaultLoadingComponent className="min-h-[400px] p-4" />,
      ssr: false
    }
  ),

  AgendaItemComments: dynamic(
    () => import('@/components/meetings/AgendaItemComments'),
    {
      loading: () => <DefaultLoadingComponent className="min-h-[200px] p-2" />,
      ssr: false
    }
  ),
};

// Chart components (heavy dependencies like recharts)
export const ChartComponents = {
  PerformanceChart: dynamic(
    () => import('@/components/charts/PerformanceChart'),
    {
      loading: () => <DefaultLoadingComponent className="h-64 w-full" />,
      ssr: false
    }
  ),

  MetricsChart: dynamic(
    () => import('@/components/charts/MetricsChart'),
    {
      loading: () => <DefaultLoadingComponent className="h-48 w-full" />,
      ssr: false
    }
  ),
};

// Development tools (dev only)
export const DevComponents = {
  BundleAnalyzer: dynamic(
    () => import('@/components/development/BundleAnalyzer'),
    {
      loading: () => <DefaultLoadingComponent className="h-32 w-full" />,
      ssr: false
    }
  ),

  PerformanceMonitor: dynamic(
    () => import('@/components/development/PerformanceMonitor'),
    {
      loading: () => <DefaultLoadingComponent className="h-24 w-full" />,
      ssr: false
    }
  ),
};

// Utility for creating optimized dynamic imports
export function createOptimizedComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options: {
    loading?: ComponentType<any>;
    ssr?: boolean;
    loadingClassName?: string;
  } = {}
) {
  const {
    loading = () => <DefaultLoadingComponent className={options.loadingClassName} />,
    ssr = false
  } = options;

  return dynamic(importFn, {
    loading,
    ssr
  });
}

// Bundle size monitoring
export class BundleSizeMonitor {
  private static metrics: Map<string, number> = new Map();

  static recordComponentLoad(componentName: string, loadTime: number) {
    if (process.env.NODE_ENV === 'development') {
      this.metrics.set(componentName, loadTime);
      console.log(`📦 Component loaded: ${componentName} (${loadTime}ms)`);
    }
  }

  static getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  static getSlowComponents(threshold: number = 1000) {
    return Array.from(this.metrics.entries())
      .filter(([, time]) => time > threshold)
      .sort(([, a], [, b]) => b - a);
  }
}

// Performance wrapper for monitoring component load times
export function withLoadTimeMonitoring<P extends object>(
  Component: ComponentType<P>,
  componentName: string
): ComponentType<P> {
  return function MonitoredComponent(props: P) {
    const startTime = performance.now();
    
    // Record load time after component mounts
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const loadTime = performance.now() - startTime;
        BundleSizeMonitor.recordComponentLoad(componentName, loadTime);
      }, 0);
    }

    return <Component {...props} />;
  };
}

// Preload critical components
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload commonly used components
    import('@/components/teams/KnowledgeDetailModal');
    import('@/components/meetings/MeetingHistoryModal');
    
    console.log('🚀 Critical components preloaded');
  }
}

// Initialize preloading on client-side
if (typeof window !== 'undefined') {
  // Preload after initial page load
  window.addEventListener('load', () => {
    setTimeout(preloadCriticalComponents, 2000);
  });
}
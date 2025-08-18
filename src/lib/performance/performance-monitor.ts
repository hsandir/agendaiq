'use client';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled = typeof window !== 'undefined' && 'performance' in window;

  constructor() {
    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor page load times
    window.addEventListener('load', () => {
      this.measurePageLoad();
    });

    // Monitor API call timings
    this.interceptFetch();
  }

  private measurePageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.addMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
      this.addMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      this.addMetric('first_contentful_paint', this.getFirstContentfulPaint());
      this.addMetric('largest_contentful_paint', this.getLargestContentfulPaint());
    }
  }

  private getFirstContentfulPaint(): number {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private getLargestContentfulPaint(): number {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lcp = entries[entries.length - 1];
          resolve(lcp.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }) as Record<string, unknown>;
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        let url: string | undefined;
        
        if (typeof args[0] === 'string') {
          url = args[0];
        } else if (args[0] && 'url' in args[0]) {
          url = (args[0] as Request).url;
        } else if (args[0] instanceof URL) {
          url = args[0].toString();
        }
        
        // Track API call performance
        if (url && url.includes('/api/user/')) {
          const endpoint = url.split('/').pop() || 'unknown';
          this.addMetric(`api_${endpoint}`, endTime - startTime, url);
        }
        
        return response;
      } catch (error: unknown) {
        const endTime = performance.now();
        let url: string | undefined;
        
        if (typeof args[0] === 'string') {
          url = args[0];
        } else if (args[0] && 'url' in args[0]) {
          url = (args[0] as Request).url;
        } else if (args[0] instanceof URL) {
          url = args[0].toString();
        }
        
        if (url) {
          const endpoint = url.split('/').pop() || 'unknown';
          this.addMetric(`api_error_${endpoint}`, endTime - startTime, url);
        }
        throw error;
      }
    };
  }

  public addMetric(name: string, value: number, url?: string) {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      timestamp: Date.now(),
      url,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(metric);

    // Keep only the last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Log performance issues in development
    if (process.env.NODE_ENV === 'development') {
      if (name === 'page_load_time' && value > 150) {
        console.warn(`🐌 Slow page load: ${value.toFixed(2)}ms (target: <150ms)`);
      }
      if (name.startsWith('api_') && value > 100) {
        console.warn(`🐌 Slow API call: ${name} took ${value.toFixed(2)}ms`);
      }
    }

    // Send critical metrics to monitoring endpoint
    if (this.shouldReport(metric)) {
      this.reportMetric(metric);
    }
  }

  private shouldReport(metric: PerformanceMetric): boolean {
    // Report page load times over 150ms
    if (metric.name === 'page_load_time' && metric.value > 150) return true;
    
    // Report API calls over 100ms
    if (metric.name.startsWith('api_') && metric.value > 100) return true;
    
    // Report errors
    if (metric.name.includes('error')) return true;
    
    return false;
  }

  private async reportMetric(metric: PerformanceMetric) {
    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error: unknown) {
      console.debug('Performance metric reporting failed:', error);
    }
  }

  // Public methods
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getAveragePageLoadTime(): number {
    const pageLoadMetrics = this.metrics.filter(m => m.name === 'page_load_time');
    if (pageLoadMetrics.length === 0) return 0;
    
    const sum = pageLoadMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return Math.round((sum / pageLoadMetrics.length) * 100) / 100;
  }

  public getAPIPerformance(): Record<string, { avg: number; count: number }> {
    const apiMetrics = this.metrics.filter(m => m.name.startsWith('api_'));
    const grouped: Record<string, number[]> = {};
    
    apiMetrics.forEach(metric => {
      if (!grouped[metric.name]) grouped[(metric.name)] = [];
      grouped[(metric.name)].push(metric.value);
    });
    
    const result: Record<string, { avg: number; count: number }> = {};
    Object.entries(grouped).forEach(([name, values]) => {
      const sum = values.reduce((acc, val) => acc + val, 0);
      result[name] = {
        avg: Math.round((sum / values.length) * 100) / 100,
        count: values.length,
      };
    });
    
    return result;
  }

  public clearMetrics() {
    this.metrics = [];
  }
}

// Lazy singleton instance to prevent SSR issues
let performanceMonitor: PerformanceMonitor | null = null;

function getMonitor() {
  if (typeof window === 'undefined') return null;
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

// Hook for React components
export function usePerformanceMetrics() {
  const monitor = getMonitor();
  return {
    getMetrics: () => monitor?.getMetrics() || [],
    getAveragePageLoadTime: () => monitor?.getAveragePageLoadTime() || 0,
    getAPIPerformance: () => monitor?.getAPIPerformance() || {},
    clearMetrics: () => monitor?.clearMetrics(),
  };
}
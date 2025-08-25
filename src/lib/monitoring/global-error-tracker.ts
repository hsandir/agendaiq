'use client';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  pageUrl: string;
  userAgent: string;
  timestamp: string;
  pageLoadTime?: number;
  networkSpeed?: string;
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    viewport: string;
  };
}

interface TrackedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  breadcrumbs: BreadcrumbEntry[];
  customData?: Record<string, unknown>;
}

interface BreadcrumbEntry {
  timestamp: string;
  category: 'navigation' | 'user-interaction' | 'api-call' | 'console' | 'custom';
  message: string;
  data?: Record<string, unknown>;
}

class GlobalErrorTracker {
  private breadcrumbs: BreadcrumbEntry[] = [];
  private maxBreadcrumbs = 50;
  private isInitialized = false;
  private errorQueue: TrackedError[] = [];
  private isOnline = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;

    // Setup error handlers
    this.setupGlobalErrorHandling();
    this.setupUnhandledRejectionHandling();
    this.setupConsoleMonitoring();
    this.setupNetworkMonitoring();
    this.setupUserInteractionTracking();
    this.setupPerformanceMonitoring();
    this.setupVisibilityChangeTracking();

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    this.isInitialized = true;
    this.addBreadcrumb('custom', 'GlobalErrorTracker initialized');
  }

  private setupGlobalErrorHandling() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError({
        message: typeof message === 'string' ? message : 'Unknown error',
        stack: error?.stack,
        context: this.getErrorContext(),
        breadcrumbs: [...this.breadcrumbs],
        customData: {
          source,
          lineno,
          colno,
          errorType: 'javascript-error'
        }
      });
      return false;
    };
  }

  private setupUnhandledRejectionHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        context: this.getErrorContext(),
        breadcrumbs: [...this.breadcrumbs],
        customData: {
          reason: event.reason,
          errorType: 'unhandled-rejection'
        }
      });
    });
  }

  private setupConsoleMonitoring() {
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    console.error = (...args) => {
      this.addBreadcrumb('console', 'Console Error', { args: args.map(this.stringifyArg) });
      
      // Capture console errors as trackable errors
      const message = (args.map(this.stringifyArg).join(' '));
      this.captureError({
        message: `Console Error: ${message}`,
        context: this.getErrorContext(),
        breadcrumbs: [...this.breadcrumbs],
        customData: {
          errorType: 'console-error',
          level: 'error'
        }
      });

      originalConsole.error(...args);
    };

    console.warn = (...args) => {
      this.addBreadcrumb('console', 'Console Warning', { args: args.map(this.stringifyArg) });
      originalConsole.warn(...args);
    };

    console.info = (...args) => {
      this.addBreadcrumb('console', 'Console Info', { args: args.map(this.stringifyArg) });
      originalConsole.info(...args);
    };
  }

  private setupNetworkMonitoring() {
    // Monitor fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : 
                   (args[0] instanceof Request ? args[0].url : 
                   (args[0] as { url?: string })?.url ?? 'unknown');
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.addBreadcrumb('api-call', `Fetch: ${url}`, {
          status: response.status,
          duration,
          success: response.ok
        });

        if (!response.ok) {
          this.captureError({
            message: `API Error: ${response.status} ${response.statusText} - ${url}`,
            context: this.getErrorContext(),
            breadcrumbs: [...this.breadcrumbs],
            customData: {
              errorType: 'api-error',
              url,
              status: response.status,
              statusText: response.statusText,
              duration
            }
          });
        }

        return response;
      } catch (error: unknown) {
        const duration = Date.now() - startTime;
        
        this.addBreadcrumb('api-call', `Fetch Failed: ${url}`, {
          error: (error as Error).message,
          duration
        });

        this.captureError({
          message: `Network Error: ${(error as Error).message} - ${url}`,
          stack: (error as Error).stack,
          context: this.getErrorContext(),
          breadcrumbs: [...this.breadcrumbs],
          customData: {
            errorType: 'network-error',
            url,
            duration
          }
        });

        throw error;
      }
    };
  }

  private setupUserInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      const tagName = target.tagName.toLowerCase();
      const id = target.id;
      const className = target.className;
      const textContent = target.textContent?.slice(0, 50) ?? '';

      this.addBreadcrumb('user-interaction', 'Click', {
        element: tagName,
        id,
        className,
        text: textContent
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      
      this.addBreadcrumb('user-interaction', 'Form Submit', {
        formId: form.id,
        formAction: form.action,
        formMethod: form.method
      });
    });

    // Track input changes (throttled)
    let inputTimeout: NodeJS.Timeout;
    document.addEventListener('input', (event) => {
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(() => {
        const input = event.target as HTMLInputElement;
        
        this.addBreadcrumb('user-interaction', 'Input Change', {
          inputType: input.type,
          inputName: input.name,
          inputId: input.id
        });
      }, 500);
    });
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (performance?.navigation && performance?.timing) {
          const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
          
          this.addBreadcrumb('custom', 'Page Load Complete', {
            loadTime,
            navigationType: performance.navigation.type
          });

          if (loadTime > 5000) { // Slow page load
            this.captureError({
              message: `Slow Page Load: ${loadTime}ms`,
              context: this.getErrorContext(),
              breadcrumbs: [...this.breadcrumbs],
              customData: {
                errorType: 'performance-issue',
                loadTime,
                navigationType: performance.navigation.type
              }
            });
          }
        }
      }, 100);
    });

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              this.addBreadcrumb('custom', 'Long Task Detected', {
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e: unknown) {
        // PerformanceObserver not supported
      }
    }
  }

  private setupVisibilityChangeTracking() {
    document.addEventListener('visibilitychange', () => {
      this.addBreadcrumb('custom', 'Visibility Change', {
        hidden: document.hidden,
        visibilityState: document.visibilityState
      });
    });
  }

  private getErrorContext(): ErrorContext {
    return {
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        type: this.getDeviceType(),
        os: this.getOS(),
        browser: this.getBrowser(),
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      pageLoadTime: performance?.timing ? 
        performance.timing.loadEventEnd - performance.timing.navigationStart : undefined,
      networkSpeed: (navigator as Navigator & { connection?: { effectiveType?: string } })?.connection?.effectiveType ?? 'unknown'
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Win')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('X11')) return 'UNIX';
    if (userAgent.includes('Linux')) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  private addBreadcrumb(category: BreadcrumbEntry['category'], message: string, data?: Record<string, unknown>) {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      category,
      message,
      data
    });

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  private async captureError(error: TrackedError) {
    if (this.isOnline) {
      try {
        await this.sendErrorToServer(error);
      } catch (e: unknown) {
        // If sending fails, queue the error
        this.errorQueue.push(error);
      }
    } else {
      this.errorQueue.push(error);
    }
  }

  private async sendErrorToServer(error: TrackedError) {
    const response = await fetch('/api/monitoring/real-time-errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: error.context.pageUrl,
        userAgent: error.context.userAgent,
        timestamp: error.context.timestamp,
        userId: error.context.userId,
        sessionId: error.context.sessionId,
        pageLoadTime: error.context.pageLoadTime,
        networkSpeed: error.context.networkSpeed,
        deviceInfo: error.context.deviceInfo,
        breadcrumbs: error.breadcrumbs,
        customData: error.customData
      });
    });

    if (!response.ok) {
      throw new Error(`Failed to send error: ${response.status}`);
    }

    return response.json();
  }

  private async flushErrorQueue() {
    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift();
      if (error) {
        try {
          await this.sendErrorToServer(error);
        } catch (e: unknown) {
          // Re-queue the error if it still fails
          this.errorQueue.unshift(error);
          break;
        }
      }
    }
  }

  private stringifyArg(arg: unknown): string {
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    
    try {
      return JSON.stringify(arg, null, 2);
    } catch (e: unknown) {
      return String(arg);
    }
  }

  // Public methods
  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: Record<string, unknown>) {
    this.addBreadcrumb('custom', `Manual Log: ${message}`, { level, extra });
    
    if (level === 'error') {
      this.captureError({
        message: `Manual Error: ${message}`,
        context: this.getErrorContext(),
        breadcrumbs: [...this.breadcrumbs],
        customData: { level, extra, errorType: 'manual' }
      });
    }
  }

  public setUser(userId: string) {
    this.addBreadcrumb('custom', 'User Set', { userId });
  }

  public setExtra(key: string, value: unknown) {
    this.addBreadcrumb('custom', 'Extra Data Set', { [key]: value });
  }

  public clearBreadcrumbs() {
    this.breadcrumbs = [];
    this.addBreadcrumb('custom', 'Breadcrumbs Cleared');
  }
}

// Global instance
export const globalErrorTracker = new GlobalErrorTracker();

// Helper function to manually capture errors
export function captureError(error: Error | string, extra?: Record<string, unknown>) {
  if (typeof error === 'string') {
    globalErrorTracker.captureMessage(error, 'error', extra);
  } else {
    globalErrorTracker.captureMessage(error.message, 'error', { 
      stack: error.stack, 
      ...extra 
    });
  }
}

// Helper function to log messages
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: Record<string, unknown>) {
  globalErrorTracker.captureMessage(message, level, extra);
}

export default globalErrorTracker;
// Global Error Tracking System

// Extend XMLHttpRequest interface for tracking
declare global {
  interface XMLHttpRequest {
    _method?: string;
    _url?: string;
  }
}

export interface ErrorDetail {
  id: string;
  timestamp: string;
  type: 'error' | 'warning' | 'info' | 'network' | 'unhandledRejection' | 'console';
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  url?: string;
  method?: string;
  status?: number;
  statusText?: string;
  userAgent: string;
  metadata?: Record<string, any>;
  componentStack?: string;
  errorBoundary?: boolean;
  errorBoundaryInfo?: any;
}

class ErrorTracker {
  private errors: ErrorDetail[] = [];
  private maxErrors = 100;
  private listeners: ((error: ErrorDetail) => void)[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Intercept window.onerror
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.trackError({
        type: 'error',
        message: typeof message === 'string' ? message : String(message),
        source: source || undefined,
        lineno,
        colno,
        stack: error?.stack,
        url: window.location.href,
      });
      
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Intercept unhandledrejection
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'unhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        url: window.location.href,
      });
    });

    // Intercept console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.map(arg => {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
          try {
            // Try to stringify the object
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            // If circular reference or other error, use toString
            return arg.toString();
          }
        }
        return String(arg);
      }).join(' ');
      
      this.trackError({
        type: 'console',
        message,
        stack: new Error().stack,
        url: window.location.href,
      });
      
      originalConsoleError.apply(console, args);
    };

    // Intercept console.warn
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const message = args.map(arg => {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
          try {
            // Try to stringify the object
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            // If circular reference or other error, use toString
            return arg.toString();
          }
        }
        return String(arg);
      }).join(' ');
      
      this.trackError({
        type: 'warning',
        message,
        stack: new Error().stack,
        url: window.location.href,
      });
      
      originalConsoleWarn.apply(console, args);
    };

    // Intercept fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const method = options?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.trackError({
            type: 'network',
            message: `${method} ${url} failed with status ${response.status}`,
            url: String(url),
            method,
            status: response.status,
            statusText: response.statusText,
          });
        }
        
        return response;
      } catch (error) {
        this.trackError({
          type: 'network',
          message: `${method} ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
          url: String(url),
          method,
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    };

    // Intercept XMLHttpRequest errors
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string, async?: boolean, user?: string | null, password?: string | null) {
      this._method = method;
      this._url = url;
      if (async !== undefined) {
        if (user !== undefined && password !== undefined) {
          return originalXHROpen.call(this, method, url, async, user, password);
        } else if (user !== undefined) {
          return originalXHROpen.call(this, method, url, async, user);
        } else {
          return originalXHROpen.call(this, method, url, async);
        }
      }
      return originalXHROpen.call(this, method, url);
    };
    
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener('error', () => {
        ErrorTrackerInstance.trackError({
          type: 'network',
          message: `XHR ${this._method} ${this._url} failed`,
          url: this._url,
          method: this._method,
        });
      });
      
      this.addEventListener('load', () => {
        if (this.status >= 400) {
          ErrorTrackerInstance.trackError({
            type: 'network',
            message: `XHR ${this._method} ${this._url} failed with status ${this.status}`,
            url: this._url,
            method: this._method,
            status: this.status,
            statusText: this.statusText,
          });
        }
      });
      
      return originalXHRSend.call(this, body);
    };
  }

  trackError(errorInfo: Partial<ErrorDetail>) {
    // Ensure timestamp is always a valid ISO string
    const timestamp = errorInfo.timestamp && typeof errorInfo.timestamp === 'string' 
      ? errorInfo.timestamp 
      : new Date().toISOString()
      
    const error: ErrorDetail = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: errorInfo.type || 'error',
      message: errorInfo.message || 'Unknown error',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      ...errorInfo,
      timestamp, // Override to ensure it's always our validated timestamp
    };

    this.errors.unshift(error);
    
    // Keep only maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(error));

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('debug-errors', JSON.stringify(this.errors));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  getErrors(): ErrorDetail[] {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debug-errors');
    }
  }

  subscribe(listener: (error: ErrorDetail) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('debug-errors');
        if (stored) {
          this.errors = JSON.parse(stored);
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  // Export errors as JSON
  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }

  // Get error statistics
  getStatistics() {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      last24Hours: 0,
      lastHour: 0,
      last5Minutes: 0,
    };

    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    const fiveMinutes = 5 * 60 * 1000;

    this.errors.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

      // Time-based counts
      const errorTime = new Date(error.timestamp).getTime();
      const age = now - errorTime;

      if (age < fiveMinutes) stats.last5Minutes++;
      if (age < hour) stats.lastHour++;
      if (age < day) stats.last24Hours++;
    });

    return stats;
  }
}

// Singleton instance
const ErrorTrackerInstance = new ErrorTracker();

// Load persisted errors on initialization
if (typeof window !== 'undefined') {
  ErrorTrackerInstance.loadFromStorage();
}

export default ErrorTrackerInstance;
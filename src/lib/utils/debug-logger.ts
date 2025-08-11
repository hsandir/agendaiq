/**
 * Debug Logger Utility
 * Controls logging based on environment
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.DEBUG === 'true';

export const DebugLogger = {
  log: (...args: unknown[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Always log errors
    console.error(...args);
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.warn(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDebugEnabled) {
      console.debug(...args);
    }
  },
  
  table: (data: unknown) => {
    if (isDevelopment || isDebugEnabled) {
      console.table(data);
    }
  },
  
  group: (label: string) => {
    if (isDevelopment || isDebugEnabled) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDevelopment || isDebugEnabled) {
      console.groupEnd();
    }
  }
};

// Export a singleton instance
export default DebugLogger;
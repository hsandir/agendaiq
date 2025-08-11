/**
 * Debug Logger Utility
 * Controls logging based on environment
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.DEBUG === 'true';

export const DebugLogger = {
  log: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDebugEnabled) {
      console.debug(...args);
    }
  },
  
  table: (data: any) => {
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
'use client';

import { useEffect } from 'react';
import ErrorTrackerInstance from '@/lib/debug/error-tracker';

export function DebugInitializer() {
  useEffect(() => {
    // Initialize error tracker
    console.log('🐛 Debug system initialized');
    
    // Add global shortcut to access errors
    if (typeof window !== 'undefined') {
      (window as any).debugErrors = {
        getAll: () => ErrorTrackerInstance.getErrors(),
        getStats: () => ErrorTrackerInstance.getStatistics(),
        clear: () => ErrorTrackerInstance.clearErrors(),
        export: () => ErrorTrackerInstance.exportErrors(),
      };
      
      console.log('💡 Debug commands available in console:');
      console.log('  window.debugErrors.getAll() - Get all captured errors');
      console.log('  window.debugErrors.getStats() - Get error statistics');
      console.log('  window.debugErrors.clear() - Clear all errors');
      console.log('  window.debugErrors.export() - Export errors as JSON');
    }
  }, []);
  
  return null;
}
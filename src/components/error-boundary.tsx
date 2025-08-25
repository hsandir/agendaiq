'use client';

import { useEffect } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-destructive/10 rounded-full">
          <svg
            className="w-6 h-6 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h2 className="mt-4 text-xl font-semibold text-center text-foreground">
          Something went wrong
        </h2>
        
        <p className="mt-2 text-sm text-center text-muted-foreground">
          An unexpected error occurred. We have been notified and are working to fix it.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-muted rounded text-xs">
            <summary className="cursor-pointer font-medium">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={resetErrorBoundary}
            className="flex-1 px-4 py-2 bg-primary text-foreground rounded-md hover:bg-primary transition-colors"
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ?? ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to console (Sentry disabled)
        console.error('Error boundary caught:', {
          error: error.message,
          stack: error.stack,
          errorInfo,
          componentStack: errorInfo.componentStack,
        });
      }}
      onReset={() => {
        // Clear any error state if needed
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
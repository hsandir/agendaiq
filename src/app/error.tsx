'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (Sentry disabled - subscription expired)
    console.error('Application error:', error);
    
    // Also capture to our local error API for debugging
    try {
      fetch('/api/error-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          url: window.location.href,
        }),
      }).catch(e => console.error('Failed to capture error:', e));
    } catch (e: unknown) {
      console.error('Error capturing error:', e);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="max-w-md w-full">
        <div className="bg-card shadow-lg rounded-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-destructive/10 rounded-full">
            <svg
              className="w-8 h-8 text-destructive"
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

          <h1 className="mt-6 text-2xl font-bold text-center text-foreground">
            Something went wrong!
          </h1>

          <p className="mt-4 text-center text-muted-foreground">
            We apologize for the inconvenience. An unexpected error has occurred. 
            Our team has been notified and is working to fix the issue.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">Error details:</p>
              <p className="mt-1 text-sm text-muted-foreground break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 px-4 py-2 bg-primary text-foreground rounded-md hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Try again
            </button>
            
            <Link
              href="/dashboard"
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted transition-colors text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Go to Dashboard
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-primary hover:text-primary"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
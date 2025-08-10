"use client";

import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

export default function NotFound() {
  // Log 404 errors to Sentry (as breadcrumb, not exception)
  if (typeof window === 'undefined') {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: '404 Page Not Found',
      level: 'info',
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-card shadow-lg rounded-lg p-8">
          <div className="flex items-center justify-center w-20 h-20 mx-auto bg-primary rounded-full">
            <span className="text-4xl font-bold text-primary">404</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-foreground">
            Page not found
          </h1>

          <p className="mt-4 text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. 
            Please check the URL or navigate back to a known page.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="flex-1 px-6 py-3 bg-primary text-foreground rounded-md hover:bg-primary transition-colors text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Go to Dashboard
            </Link>
            
            <Link
              href="/"
              className="flex-1 px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted transition-colors text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Return Home
            </Link>
          </div>

          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="text-sm text-primary hover:text-primary"
            >
              ← Go back to previous page
            </button>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
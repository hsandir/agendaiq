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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex items-center justify-center w-20 h-20 mx-auto bg-blue-100 rounded-full">
            <span className="text-4xl font-bold text-blue-600">404</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Page not found
          </h1>

          <p className="mt-4 text-gray-600">
            Sorry, we couldn't find the page you're looking for. 
            Please check the URL or navigate back to a known page.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </Link>
            
            <Link
              href="/"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Return Home
            </Link>
          </div>

          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Go back to previous page
            </button>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
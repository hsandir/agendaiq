import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export interface ErrorHandlerOptions {
  /**
   * Whether to send the error to Sentry
   * @default true
   */
  captureError?: boolean;
  
  /**
   * Additional context to attach to the error
   */
  context?: Record<string, any>;
  
  /**
   * User information to attach to the error
   */
  user?: {
    id?: string;
    email?: string;
    username?: string;
    staffId?: string;
    role?: string;
  };
  
  /**
   * Custom error message to return to the client
   */
  message?: string;
  
  /**
   * HTTP status code to return
   * @default 500
   */
  statusCode?: number;
  
  /**
   * Whether to include error details in development
   * @default true
   */
  includeDetails?: boolean;
}

/**
 * Handles server-side errors with Sentry integration
 */
export function handleServerError(
  error: unknown,
  request: NextRequest,
  options: ErrorHandlerOptions = {}
): NextResponse {
  const {
    captureError = true,
    context = {},
    user,
    message = 'An unexpected error occurred',
    statusCode = 500,
    includeDetails = true,
  } = options;
  
  // Extract error details
  const errorDetails = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
  } : {
    name: 'Unknown Error',
    message: String(error),
    stack: undefined,
  };
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Server Error:', errorDetails);
  }
  
  // Send to Sentry if enabled
  if (captureError) {
    Sentry.withScope((scope) => {
      // Add request context
      scope.setContext('request', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        userAgent: request.headers.get('user-agent'),
      });
      
      // Add custom context
      scope.setContext('custom', context);
      
      // Add user context if provided
      if (user) {
        scope.setUser{
          id: user.id,
          email: user.email,
          username: ((user as Record<string, unknown>).username,
          staffId: (user as Record<string, unknown>).staffId,
          role: (user as Record<string, unknown>).role,
        });
      }
      
      // Add breadcrumb
      scope.addBreadcrumb({
        category: 'server-error',
        message: `Error in ${request.method} ${request.url}`,
        level: 'error',
        data: errorDetails,
      });
      
      // Capture the exception
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(errorDetails.message, 'error');
      }
    });
  }
  
  // Build error response
  const responseBody: Record<string, unknown> = {
    error: message,
    timestamp: new Date().toISOString(),
  };
  
  // Include details in development if enabled
  if (process.env.NODE_ENV === 'development' && includeDetails) {
    responseBody.details = errorDetails;
  }
  
  return NextResponse.json(responseBody, { status: statusCode });
}

/**
 * Wraps an API handler with error handling
 */
export function withErrorHandler<T extends (...args: Record<string, unknown>[]) => Promise<NextResponse>>(
  handler: T,
  defaultOptions?: ErrorHandlerOptions
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      const request = args[0] as NextRequest;
      return handleServerError(error, request, defaultOptions);
    }
  }) as T;
}

/**
 * Creates a custom error with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Common API error responses
 */
export const ApiErrors = {
  unauthorized: () => new ApiError('Unauthorized', 401),
  forbidden: () => new ApiError('Forbidden', 403),
  notFound: (resource: string) => new ApiError(`${resource} not found`, 404),
  badRequest: (message: string) => new ApiError(message, 400),
  conflict: (message: string) => new ApiError(message, 409),
  rateLimit: () => new ApiError('Too many requests', 429),
  serverError: (message = 'Internal server error') => new ApiError(message, 500),
} as const;
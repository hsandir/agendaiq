// Sentry disabled - subscription expired
import { NextRequest, NextResponse } from 'next/server';

export interface ErrorHandlerOptions {
  /**
   * Whether to log the error to console
   * @default true
   */
  captureError?: boolean;
  
  /**
   * Additional context to attach to the error
   */
  context?: Record<string, unknown>;
  
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
 * Handles server-side errors (Sentry disabled - console logging only)
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
  
  // Log error to console (Sentry disabled)
  if (captureError) {
    console.error('Server Error:', {
      error: errorDetails,
      request: {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
      },
      context,
      user,
      timestamp: new Date().toISOString(),
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
    public context?: Record<string, unknown>
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
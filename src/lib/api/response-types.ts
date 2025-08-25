// Enhanced standardized API response types for AgendaIQ

import { NextResponse } from 'next/server';
import { APIError, SystemError } from '@/lib/types/errors';
import { ErrorHandler } from '@/lib/utils/error-handler';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Helper functions for creating consistent responses
export const createSuccessResponse = <T>(
  data: T, 
  message?: string, 
  requestId?: string
): APIResponse<T> => ({
  success: true,
  data,
  message,
  requestId,
  timestamp: new Date().toISOString()
});

export const createErrorResponse = (
  error: APIError | SystemError | string, 
  requestId?: string
): APIResponse => {
  let apiError: APIError;

  if (typeof error === 'string') {
    apiError = {
      type: 'INTERNAL_ERROR',
      message: error,
      code: 'GEN_001',
      timestamp: new Date().toISOString()
    };
  } else if ('type' in error && ['DATABASE_ERROR', 'AUTH_ERROR', 'VALIDATION_ERROR', 'NETWORK_ERROR', 'UNKNOWN_ERROR'].includes(error?.type)) {
    // It's a SystemError, convert to APIError
    apiError = ErrorHandler.systemErrorToAPIError(error as SystemError);
  } else {
    // It's already an APIError
    apiError = error as APIError;
  }

  return {
    success: false,
    error: apiError,
    requestId,
    timestamp: new Date().toISOString()
  };
};

export const createPaginatedResponse = <T>(
  data: T[], 
  page: number,
  limit: number,
  total: number,
  message?: string,
  requestId?: string
): PaginatedResponse<T> => ({
  success: true,
  data,
  message,
  requestId,
  pagination: {
    page,
    limit,
    total,
    hasMore: page * limit < total,
    totalPages: Math.ceil(total / limit)
  },
  timestamp: new Date().toISOString()
});

// NextResponse helpers
export function createSuccessNextResponse<T>(
  data: T, 
  message?: string, 
  status: number = 200,
  requestId?: string
): NextResponse {
  const response = createSuccessResponse(data, message, requestId);
  return NextResponse.json(response, { status });
}

export function createErrorNextResponse(
  error: APIError | SystemError | string,
  status: number = 500,
  requestId?: string
): NextResponse {
  const response = createErrorResponse(error, requestId);
  return NextResponse.json(response, { status });
}

export function createPaginatedNextResponse<T>(
  data: T[], 
  page: number,
  limit: number,
  total: number,
  message?: string,
  status: number = 200,
  requestId?: string
): NextResponse {
  const response = createPaginatedResponse(data, page, limit, total, message, requestId);
  return NextResponse.json(response, { status });
}

// Validation helpers
export function validatePaginationParams(
  page?: string | null, 
  limit?: string | null
): { page: number; limit: number; offset: number } {
  const validatedPage = Math.max(1, parseInt(page ?? '1') ?? 1);
  const validatedLimit = Math.min(Math.max(1, parseInt(limit ?? '10') ?? 10), 100);
  const offset = (validatedPage - 1) * validatedLimit;

  return {
    page: validatedPage,
    limit: validatedLimit,
    offset
  };
}

export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined ?? data[field] === null ?? data[field] === '') {
      errors.push({
        field: String(field),
        message: `${String(field)} is required`,
        code: 'REQUIRED_FIELD'
      });
    }
  }
  
  return errors;
}

// Error categorization helper (enhanced)
export const categorizeAPIError = (error: unknown): APIError => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Database errors
    if (message.includes('prisma') || message.includes('database') || message.includes('connection')) {
      return {
        type: 'INTERNAL_ERROR',
        message: 'Database operation failed',
        code: 'DB_001',
        details: { originalError: error?.message },
        timestamp: new Date().toISOString()
      };
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('token') || message.includes('auth')) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Authentication required',
        code: 'AUTH_001',
        details: { originalError: error?.message },
        timestamp: new Date().toISOString()
      };
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        code: 'VAL_001',
        details: { originalError: error?.message },
        timestamp: new Date().toISOString()
      };
    }
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return {
        type: 'INTERNAL_ERROR',
        message: 'Network operation failed',
        code: 'NET_001',
        details: { originalError: error?.message },
        timestamp: new Date().toISOString()
      };
    }
    
    // Default to internal error
    return {
      type: 'INTERNAL_ERROR',
      message: 'Internal server error',
      code: 'SYS_001',
      details: { originalError: error?.message },
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    type: 'INTERNAL_ERROR',
    message: 'Unknown error occurred',
    code: 'UNK_001',
    details: { originalError: String(error) },
    timestamp: new Date().toISOString()
  };
};
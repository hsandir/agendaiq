// Standardized API response types for AgendaIQ

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
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
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface APIError {
  type: 'DATABASE_ERROR' | 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'CLIENT_ERROR';
  message: string;
  code?: string;
  details?: string;
  validationErrors?: ValidationError[];
}

// Helper functions for creating consistent responses
export const createSuccessResponse = <T>(data: T, message?: string): APIResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

export const createErrorResponse = (error: APIError): APIResponse => ({
  success: false,
  error: error.message,
  timestamp: new Date().toISOString()
});

export const createPaginatedResponse = <T>(
  data: T[], 
  pagination: PaginatedResponse<T>['pagination'],
  message?: string
): PaginatedResponse<T> => ({
  success: true,
  data,
  message,
  pagination,
  timestamp: new Date().toISOString()
});

// Error categorization helper
export const categorizeAPIError = (error: unknown): APIError => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Database errors
    if (message.includes('prisma') || message.includes('database') || message.includes('connection')) {
      return {
        type: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: error.message
      };
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('token') || message.includes('auth')) {
      return {
        type: 'AUTH_ERROR',
        message: 'Authentication required',
        details: error.message
      };
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.message
      };
    }
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Network operation failed',
        details: error.message
      };
    }
    
    // Server errors
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return {
        type: 'SERVER_ERROR',
        message: 'Server error occurred',
        details: error.message
      };
    }
    
    // Default to client error
    return {
      type: 'CLIENT_ERROR',
      message: 'Request failed',
      details: error.message
    };
  }
  
  return {
    type: 'SERVER_ERROR',
    message: 'Unknown error occurred',
    details: String(error)
  };
};
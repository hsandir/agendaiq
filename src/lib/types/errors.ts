// Comprehensive error type system for AgendaIQ

export interface SystemError {
  type: 'DATABASE_ERROR' | 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  context?: string;
}

export interface APIError {
  type: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_ERROR' | 'VALIDATION_ERROR';
  message: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

export interface DatabaseError extends SystemError {
  type: 'DATABASE_ERROR';
  query?: string;
  table?: string;
  operation?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
}

export interface AuthError extends SystemError {
  type: 'AUTH_ERROR';
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
}

export interface ValidationError extends SystemError {
  type: 'VALIDATION_ERROR';
  validationErrors: ValidationErrorDetail[];
}

// Error creation utilities
export function createSystemError(
  type: SystemError['type'], 
  message: string, 
  details?: Record<string, unknown>,
  context?: string,
  code?: string
): SystemError {
  return {
    type,
    message,
    code,
    details,
    context,
    timestamp: new Date().toISOString()
  };
}

export function createAPIError(
  type: APIError['type'],
  message: string,
  code: string,
  details?: Record<string, unknown>
): APIError {
  return {
    type,
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  };
}

export function createDatabaseError(
  message: string,
  query?: string,
  table?: string,
  operation?: DatabaseError['operation'],
  details?: Record<string, unknown>
): DatabaseError {
  return {
    type: 'DATABASE_ERROR',
    message,
    query,
    table,
    operation,
    details,
    timestamp: new Date().toISOString()
  };
}

export function createAuthError(
  message: string,
  userId?: number,
  sessionId?: string,
  ipAddress?: string,
  details?: Record<string, unknown>
): AuthError {
  return {
    type: 'AUTH_ERROR',
    message,
    userId,
    sessionId,
    ipAddress,
    details,
    timestamp: new Date().toISOString()
  };
}

export function createValidationError(
  message: string,
  validationErrors: ValidationErrorDetail[],
  details?: Record<string, unknown>
): ValidationError {
  return {
    type: 'VALIDATION_ERROR',
    message,
    validationErrors,
    details,
    timestamp: new Date().toISOString()
  };
}

// Error type guards
export function isSystemError(error: unknown): error is SystemError {
  return typeof error === 'object' && 
         error !== null && 
         'type' in error && 
         'message' in error && 
         'timestamp' in error
}

export function isDatabaseError(error: SystemError): error is DatabaseError {
  return error.type === 'DATABASE_ERROR'
}

export function isAuthError(error: SystemError): error is AuthError {
  return error.type === 'AUTH_ERROR'
}

export function isValidationError(error: SystemError): error is ValidationError {
  return error.type === 'VALIDATION_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export function getErrorSeverity(error: SystemError): ErrorSeverity {
  switch (error.type) {
    case 'AUTH_ERROR':
      return ErrorSeverity.HIGH;
    case 'DATABASE_ERROR':
      return ErrorSeverity.HIGH;
    case 'VALIDATION_ERROR':
      return ErrorSeverity.MEDIUM;
    case 'NETWORK_ERROR':
      return ErrorSeverity.MEDIUM;
    case 'UNKNOWN_ERROR':
      return ErrorSeverity.CRITICAL;
    default:
      return ErrorSeverity.MEDIUM
  }
}
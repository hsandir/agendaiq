// Centralized error handling utility for AgendaIQ

import { 
  SystemError, 
  APIError, 
  DatabaseError,
  AuthError,
  ValidationError,
  createSystemError, 
  createAPIError,
  createDatabaseError,
  createAuthError,
  createValidationError,
  getErrorSeverity,
  ErrorSeverity
} from '@/lib/types/errors';
import { Logger } from './logger';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export class ErrorHandler {
  // Database error handling
  static handleDatabaseError(error: unknown, context: string, table?: string, operation?: DatabaseError['operation']): DatabaseError {
    let dbError: DatabaseError;

    if (error instanceof PrismaClientKnownRequestError) {
      dbError = createDatabaseError(
        this.getPrismaErrorMessage(error),
        error.meta?.query as string,
        table,
        operation,
        {
          code: error.code,
          meta: error.meta,
          clientVersion: error.clientVersion
        }
      );
    } else if (error instanceof PrismaClientValidationError) {
      dbError = createDatabaseError(
        'Database validation error',
        undefined,
        table,
        operation,
        { originalError: error.message }
      );
    } else if (error instanceof Error) {
      dbError = createDatabaseError(
        error.message,
        undefined,
        table,
        operation,
        { originalError: error.message }
      );
    } else {
      dbError = createDatabaseError(
        'Unknown database error',
        undefined,
        table,
        operation,
        { originalError: String(error) }
      );
    }

    // Log the error
    this.logError(dbError, context);
    return dbError;
  }

  // Authentication error handling
  static handleAuthError(error: unknown, context: string, userId?: number, sessionId?: string, ipAddress?: string): AuthError {
    let authError: AuthError;

    if (error instanceof Error) {
      authError = createAuthError(
        error.message,
        userId,
        sessionId,
        ipAddress,
        { originalError: error.message }
      );
    } else {
      authError = createAuthError(
        'Authentication failed',
        userId,
        sessionId,
        ipAddress,
        { originalError: String(error) }
      );
    }

    // Log security event
    Logger.security(authError.message, userId, ipAddress, authError.details);
    this.logError(authError, context);
    return authError;
  }

  // Validation error handling
  static handleValidationError(error: unknown, context: string, validationErrors?: ValidationError['validationErrors']): ValidationError {
    let valError: ValidationError;

    if (error instanceof Error) {
      valError = createValidationError(
        error.message,
        validationErrors ?? [],
        { originalError: error.message }
      );
    } else {
      valError = createValidationError(
        'Validation failed',
        validationErrors ?? [],
        { originalError: String(error) }
      );
    }

    this.logError(valError, context);
    return valError;
  }

  // Network error handling
  static handleNetworkError(error: unknown, context: string): SystemError {
    let networkError: SystemError;

    if (error instanceof Error) {
      networkError = createSystemError(
        'NETWORK_ERROR',
        error.message,
        { originalError: error.message },
        context
      );
    } else {
      networkError = createSystemError(
        'NETWORK_ERROR',
        'Network operation failed',
        { originalError: String(error) },
        context
      );
    }

    this.logError(networkError, context);
    return networkError;
  }

  // Generic error handling
  static handleUnknownError(error: unknown, context: string): SystemError {
    let unknownError: SystemError;

    if (error instanceof Error) {
      unknownError = createSystemError(
        'UNKNOWN_ERROR',
        error.message,
        { 
          originalError: error.message,
          stack: error.stack 
        },
        context
      );
    } else {
      unknownError = createSystemError(
        'UNKNOWN_ERROR',
        'An unknown error occurred',
        { originalError: String(error) },
        context
      );
    }

    this.logError(unknownError, context);
    return unknownError;
  }

  // API error conversion
  static systemErrorToAPIError(systemError: SystemError): APIError {
    switch (systemError.type) {
      case 'AUTH_ERROR':
        return createAPIError('UNAUTHORIZED', systemError.message, 'AUTH_001', systemError.details);
      case 'VALIDATION_ERROR':
        return createAPIError('BAD_REQUEST', systemError.message, 'VAL_001', systemError.details);
      case 'DATABASE_ERROR':
        return createAPIError('INTERNAL_ERROR', 'Database operation failed', 'DB_001', systemError.details);
      case 'NETWORK_ERROR':
        return createAPIError('INTERNAL_ERROR', 'Network operation failed', 'NET_001', systemError.details);
      default:
        return createAPIError('INTERNAL_ERROR', 'Internal server error', 'SYS_001', systemError.details);
    }
  }

  // Error logging with severity-based handling
  static logError(error: SystemError, context?: string): void {
    const severity = getErrorSeverity(error);
    const logData = {
      ...error,
      context,
      severity
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        Logger.error(`CRITICAL ERROR: ${error.message}`, logData, context);
        // Send alert to monitoring system via security logging
        Logger.security(`Critical system error detected: ${error.type}`, error.details?.userId as number, undefined, {
          errorType: error.type,
          message: error.message,
          context,
          severity: 'CRITICAL'
        });
        break;
      case ErrorSeverity.HIGH:
        Logger.error(`HIGH SEVERITY: ${error.message}`, logData, context);
        break;
      case ErrorSeverity.MEDIUM:
        Logger.warn(`MEDIUM SEVERITY: ${error.message}`, logData, context);
        break;
      case ErrorSeverity.LOW:
        Logger.info(`LOW SEVERITY: ${error.message}`, logData, context);
        break;
    }
  }

  // Helper method to get human-readable Prisma error messages
  private static getPrismaErrorMessage(error: PrismaClientKnownRequestError): string {
    switch (error.code) {
      case 'P2002':
        return 'A record with this value already exists';
      case 'P2025':
        return 'Record not found';
      case 'P2003':
        return 'Foreign key constraint violation';
      case 'P2004':
        return 'Constraint violation';
      case 'P2021':
        return 'Table does not exist';
      case 'P2022':
        return 'Column does not exist';
      default:
        return error.message || 'Database operation failed';
    }
  }

  // Utility method for safe error extraction
  static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Unknown error occurred';
  }

  // Method to safely stringify errors for logging
  static stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
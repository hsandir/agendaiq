/**
 * Safe date formatting utilities
 * Centralized date formatting with error handling
 */

import { format as dateFnsFormat } from 'date-fns';

/**
 * Safely format a date value with error handling
 * @param dateValue - The date value to format (string, Date, or null/undefined)
 * @param formatString - The format string (date-fns format)
 * @param fallback - The fallback string to return on error
 * @returns Formatted date string or fallback
 */
export function safeFormat(
  dateValue: string | Date | null | undefined,
  formatString: string = 'MMM dd, yyyy',
  fallback: string = 'Invalid date'
): string {
  if (!dateValue) {
    return fallback;
  }

  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    if (!date || isNaN(date.getTime())) {
      return fallback;
    }

    return dateFnsFormat(date, formatString);
  } catch (error: unknown) {
    console.error('Date formatting error:', error, 'Value:', dateValue);
    return fallback;
  }
}

/**
 * Safely parse and validate a date
 * @param dateValue - The date value to parse
 * @returns Valid Date object or null
 */
export function safeParseDate(dateValue: string | Date | null | undefined): Date | null {
  if (!dateValue) {
    return null;
  }

  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    if (!date || isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * Check if a date value is valid
 * @param dateValue - The date value to check
 * @returns True if valid date, false otherwise
 */
export function isValidDateValue(dateValue: Record<string, unknown>): boolean {
  if (!dateValue) return false;
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}
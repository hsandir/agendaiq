/**
 * Safe date utilities to handle invalid dates gracefully
 */

export interface SafeDateResult {
  isValid: boolean;
  date: Date | null;
  formatted: string;
}

/**
 * Safely create a Date object from various input types
 */
export function safeDate(input: string | Date | number | null | undefined): SafeDateResult {
  if (!input) {
    return {
      isValid: false,
      date: null,
      formatted: 'No date'
    };
  }

  try {
    const date = new Date(input);
    const isValid = !isNaN(date.getTime());
    
    return {
      isValid,
      date: isValid ? date : null,
      formatted: isValid ? date.toISOString() : 'Invalid date'
    };
  } catch (error) {
    return {
      isValid: false,
      date: null,
      formatted: 'Invalid date'
    };
  }
}

/**
 * Safely format a date to locale string
 */
export function safeFormatDate(
  input: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'No date'
): string {
  const result = safeDate(input);
  
  if (!result.isValid || !result.date) {
    return fallback;
  }

  try {
    return result.date.toLocaleDateString('en-US', options);
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely format a date to locale date string
 */
export function safeFormatDateTime(
  input: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'No date'
): string {
  const result = safeDate(input);
  
  if (!result.isValid || !result.date) {
    return fallback;
  }

  try {
    return result.date.toLocaleString('en-US', options);
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely format a date to locale time string
 */
export function safeFormatTime(
  input: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'No time'
): string {
  const result = safeDate(input);
  
  if (!result.isValid || !result.date) {
    return fallback;
  }

  try {
    return result.date.toLocaleTimeString('en-US', options);
  } catch (error) {
    return fallback;
  }
}

/**
 * Check if a date input is valid
 */
export function isValidDate(input: string | Date | number | null | undefined): boolean {
  return safeDate(input).isValid;
}

/**
 * Get a safe Date object or null
 */
export function getSafeDate(input: string | Date | number | null | undefined): Date | null {
  return safeDate(input).date;
}

/**
 * Default date format options for consistent display
 */
export const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
};

export const DEFAULT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

export const DEFAULT_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit'
};
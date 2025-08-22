/**
 * Client-side validation helper
 * Uses local validation server to avoid API quota usage
 */

const VALIDATION_SERVER = 'http://localhost:3456';

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  error?: string;
}

export interface BulkValidationResult {
  results: Array<{
    id: string | number;
    success: boolean;
    data?: any;
    errors?: any[];
  }>;
}

/**
 * Validate single data against a schema
 */
export async function validate(
  schema: string,
  data: any
): Promise<ValidationResult> {
  try {
    const response = await fetch(`${VALIDATION_SERVER}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schema, data })
    });

    if (!response.ok) {
      throw new Error(`Validation server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

/**
 * Validate multiple data items
 */
export async function validateBulk(
  validations: Array<{
    id: string | number;
    schema: string;
    data: any;
  }>
): Promise<BulkValidationResult> {
  try {
    const response = await fetch(`${VALIDATION_SERVER}/validate/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validations })
    });

    if (!response.ok) {
      throw new Error(`Validation server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Bulk validation error:', error);
    return {
      results: validations.map(v => ({
        id: v.id,
        success: false,
        errors: [{ message: 'Validation server unavailable' }]
      }))
    };
  }
}

/**
 * Add custom schema to validation server
 */
export async function addSchema(
  name: string,
  schema: any
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${VALIDATION_SERVER}/schema/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, schema })
    });

    if (!response.ok) {
      throw new Error(`Failed to add schema: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Add schema error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add schema'
    };
  }
}

/**
 * Check if validation server is running
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${VALIDATION_SERVER}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Form validation helper
 */
export async function validateForm<T extends Record<string, any>>(
  formData: T,
  schema: string
): Promise<{ isValid: boolean; errors: Record<string, string> }> {
  const result = await validate(schema, formData);
  
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  
  const errors: Record<string, string> = {};
  if (result.errors) {
    for (const error of result.errors) {
      errors[error.path] = error.message;
    }
  }
  
  return { isValid: false, errors };
}

/**
 * Field validation helper
 */
export async function validateField(
  fieldName: string,
  value: any,
  schema: string
): Promise<{ isValid: boolean; error?: string }> {
  const result = await validate(schema, value);
  
  if (result.success) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: result.errors?.[0]?.message || result.error || 'Invalid value'
  };
}

/**
 * React hook for form validation
 */
export function useValidation() {
  const [isServerRunning, setIsServerRunning] = React.useState(false);
  
  React.useEffect(() => {
    checkServerHealth().then(setIsServerRunning);
  }, []);
  
  return {
    isServerRunning,
    validate,
    validateBulk,
    validateForm,
    validateField,
    addSchema
  };
}

// Common validation schemas
export const ValidationSchemas = {
  EMAIL: 'email',
  PHONE: 'phone',
  URL: 'url',
  DATE: 'date',
  LOGIN_FORM: 'loginForm',
  MEETING_FORM: 'meetingForm',
  USER_PROFILE: 'userProfile'
} as const;

// Export React if it's available
let React: any;
if (typeof window !== 'undefined' && 'React' in window) {
  React = (window as any).React;
}
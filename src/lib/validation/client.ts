/**
 * Local Validation Client
 * Cursor'da kota harcamadan validation işlemleri için client
 */

const VALIDATION_SERVER_URL = 'http://localhost:3456';

export enum ValidationSchemas {
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  DATE = 'date',
  LOGIN_FORM = 'loginForm',
  MEETING_FORM = 'meetingForm',
  USER_PROFILE = 'userProfile'
}

interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: Array<{
    path: string;
    message: string;
    code: string
  }>;
  error?: string;
}

interface ValidationResponse {
  isValid: boolean;
  errors?: Record<string, string>;
  data?: any;
}

/**
 * Validate single data against schema
 */
export async function validate(schema: string, data: any): Promise<ValidationResult> {
  try {
    const response = await fetch(`${VALIDATION_SERVER_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schema, data }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('Validation server not available, falling back to basic validation');
    return { success: false, error: 'Validation server unavailable' };
  }
}

/**
 * Validate form data (returns user-friendly format)
 */
export async function validateForm(formData: any, schema: ValidationSchemas): Promise<ValidationResponse> {
  const result = await validate(schema, formData);
  
  if (result.success) {
    return { isValid: true, data: result.data };
  }

  // Convert errors to form-friendly format
  const errors: Record<string, string> = {};
  if (result.errors) {
    result.errors.forEach(error => {
      errors[error.path] = error.message;
    });
  }

  return { isValid: false, errors };
}

/**
 * Validate single field
 */
export async function validateField(fieldName: string, value: any, schema: ValidationSchemas): Promise<{
  isValid: boolean;
  error?: string;
}> {
  const result = await validate(schema, value);
  
  if (result.success) {
    return { isValid: true };
  }

  const errorMessage = result.errors?.[0]?.message || result.error || 'Validation failed';
  return { isValid: false, error: errorMessage };
}

/**
 * Bulk validation
 */
export async function validateBulk(validations: Array<{
  id: string;
  schema: string;
  data: any
}>): Promise<Array<{
  id: string;
  success: boolean;
  data?: any;
  errors?: any[];
}>> {
  try {
    const response = await fetch(`${VALIDATION_SERVER_URL}/validate/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ validations }),
    });

    const result = await response.json();
    return result.results;
  } catch (error) {
    console.warn('Validation server not available');
    return validations.map(v => ({ id: v.id, success: false, errors: ['Server unavailable'] }));
  }
}

/**
 * Add custom schema to validation server
 */
export async function addSchema(name: string, schemaDef: any): Promise<boolean> {
  try {
    const response = await fetch(`${VALIDATION_SERVER_URL}/schema/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, schema: schemaDef }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.warn('Failed to add custom schema');
    return false;
  }
}

/**
 * Check if validation server is running
 */
export async function isValidationServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${VALIDATION_SERVER_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * React hook for validation
 */
export function useValidation() {
  const [isServerRunning, setIsServerRunning] = React.useState(false);

  React.useEffect(() => {
    const checkServer = async () => {
      const running = await isValidationServerRunning();
      setIsServerRunning(running);
    };

    checkServer();
    const interval = setInterval(checkServer, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    isServerRunning,
    validate,
    validateForm,
    validateField,
    validateBulk,
    addSchema
  };
}

// For environments without React
declare const React: any;
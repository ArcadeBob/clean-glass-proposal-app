/**
 * Input Sanitization Utilities
 *
 * Provides comprehensive input sanitization, XSS prevention, and validation
 * for all user inputs across the application.
 */

// XSS Prevention Patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /document\./gi,
  /window\./gi,
  /localStorage\./gi,
  /sessionStorage\./gi,
  /fetch\s*\(/gi,
  /XMLHttpRequest/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /<input/gi,
  /<textarea/gi,
  /<select/gi,
  /<button/gi,
  /<link/gi,
  /<meta/gi,
  /<style/gi,
  /<link/gi,
  /vbscript:/gi,
  /data:/gi,
  /&#x?[0-9a-f]+/gi, // Hex entities
  /&#[0-9]+/gi, // Decimal entities
] as const;

// Input Constraints
export const INPUT_CONSTRAINTS = {
  TEXT: {
    MAX_LENGTH: 1000,
    MIN_LENGTH: 1,
  },
  TEXTAREA: {
    MAX_LENGTH: 5000,
    MIN_LENGTH: 0,
  },
  NOTES: {
    MAX_LENGTH: 2000,
    MIN_LENGTH: 0,
  },
  PROJECT_NAME: {
    MAX_LENGTH: 100,
    MIN_LENGTH: 1,
  },
  ADDRESS: {
    MAX_LENGTH: 500,
    MIN_LENGTH: 5,
  },
  NUMERIC: {
    MAX_VALUE: 999999,
    MIN_VALUE: 0,
  },
  PERCENTAGE: {
    MAX_VALUE: 100,
    MIN_VALUE: 0,
  },
} as const;

/**
 * Sanitize text input to prevent XSS attacks
 */
export function sanitizeText(
  input: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    allowNewlines?: boolean;
  } = {}
): {
  sanitized: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const {
    maxLength = INPUT_CONSTRAINTS.TEXT.MAX_LENGTH,
    minLength = INPUT_CONSTRAINTS.TEXT.MIN_LENGTH,
    allowHtml = false,
    allowNewlines = false,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = input;

  // Check for empty input
  if (!input || input.trim().length === 0) {
    if (minLength > 0) {
      errors.push('Input cannot be empty');
      return { sanitized: '', isValid: false, errors, warnings };
    }
    return { sanitized: '', isValid: true, errors, warnings };
  }

  // Check length constraints
  if (input.length > maxLength) {
    errors.push(`Input too long. Maximum ${maxLength} characters allowed.`);
    return { sanitized: '', isValid: false, errors, warnings };
  }

  if (input.trim().length < minLength) {
    errors.push(`Input too short. Minimum ${minLength} characters required.`);
    return { sanitized: '', isValid: false, errors, warnings };
  }

  // Remove or escape HTML if not allowed
  if (!allowHtml) {
    // Check for XSS patterns
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        errors.push('Input contains potentially malicious content');
        return { sanitized: '', isValid: false, errors, warnings };
      }
    }

    // Escape HTML entities
    sanitized = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/\r?\n/g, ' ');
  } else {
    // Normalize newlines
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  // Check for suspicious patterns after sanitization
  const suspiciousPatterns = [
    /[<>]/g, // Any remaining angle brackets
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      warnings.push('Input contains potentially unsafe content');
      break;
    }
  }

  return { sanitized, isValid: true, errors, warnings };
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(
  input: string | number,
  options: {
    min?: number;
    max?: number;
    allowDecimals?: boolean;
    allowNegative?: boolean;
  } = {}
): {
  sanitized: number | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const {
    min = INPUT_CONSTRAINTS.NUMERIC.MIN_VALUE,
    max = INPUT_CONSTRAINTS.NUMERIC.MAX_VALUE,
    allowDecimals = true,
    allowNegative = false,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Convert to string if number
  const inputStr = String(input).trim();

  if (!inputStr) {
    return {
      sanitized: null,
      isValid: false,
      errors: ['Input is required'],
      warnings,
    };
  }

  // Check for non-numeric characters
  const numericPattern = allowDecimals ? /^-?\d*\.?\d+$/ : /^-?\d+$/;
  if (!numericPattern.test(inputStr)) {
    errors.push('Input must be a valid number');
    return { sanitized: null, isValid: false, errors, warnings };
  }

  const num = parseFloat(inputStr);

  // Check for NaN or Infinity
  if (isNaN(num) || !isFinite(num)) {
    errors.push('Input must be a finite number');
    return { sanitized: null, isValid: false, errors, warnings };
  }

  // Check range constraints
  if (num < min) {
    errors.push(`Value must be at least ${min}`);
    return { sanitized: null, isValid: false, errors, warnings };
  }

  if (num > max) {
    errors.push(`Value must be at most ${max}`);
    return { sanitized: null, isValid: false, errors, warnings };
  }

  // Check for negative values if not allowed
  if (!allowNegative && num < 0) {
    errors.push('Negative values are not allowed');
    return { sanitized: null, isValid: false, errors, warnings };
  }

  // Round to reasonable precision
  const sanitized = allowDecimals
    ? Math.round(num * 100) / 100
    : Math.round(num);

  return { sanitized, isValid: true, errors, warnings };
}

/**
 * Sanitize textarea input
 */
export function sanitizeTextarea(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    allowUrls?: boolean;
  } = {}
): {
  sanitized: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const {
    maxLength = INPUT_CONSTRAINTS.TEXTAREA.MAX_LENGTH,
    allowHtml = false,
    allowUrls = true,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input) {
    return { sanitized: '', isValid: true, errors, warnings };
  }

  // Check length
  if (input.length > maxLength) {
    errors.push(`Text too long. Maximum ${maxLength} characters allowed.`);
    return { sanitized: '', isValid: false, errors, warnings };
  }

  let sanitized = input;

  // Check for XSS patterns
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      errors.push('Text contains potentially malicious content');
      return { sanitized: '', isValid: false, errors, warnings };
    }
  }

  // Remove or escape HTML if not allowed
  if (!allowHtml) {
    sanitized = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Handle URLs if not allowed
  if (!allowUrls) {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    if (urlPattern.test(sanitized)) {
      warnings.push('URLs are not allowed in this field');
      sanitized = sanitized.replace(urlPattern, '[URL]');
    }
  }

  // Normalize newlines
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return { sanitized, isValid: true, errors, warnings };
}

/**
 * Sanitize project name
 */
export function sanitizeProjectName(input: string): {
  sanitized: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  return sanitizeText(input, {
    maxLength: INPUT_CONSTRAINTS.PROJECT_NAME.MAX_LENGTH,
    minLength: INPUT_CONSTRAINTS.PROJECT_NAME.MIN_LENGTH,
    allowHtml: false,
    allowNewlines: false,
  });
}

/**
 * Sanitize address
 */
export function sanitizeAddress(input: string): {
  sanitized: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  return sanitizeText(input, {
    maxLength: INPUT_CONSTRAINTS.ADDRESS.MAX_LENGTH,
    minLength: INPUT_CONSTRAINTS.ADDRESS.MIN_LENGTH,
    allowHtml: false,
    allowNewlines: false,
  });
}

/**
 * Sanitize notes
 */
export function sanitizeNotes(input: string): {
  sanitized: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  return sanitizeTextarea(input, {
    maxLength: INPUT_CONSTRAINTS.NOTES.MAX_LENGTH,
    allowHtml: false,
    allowUrls: true,
  });
}

/**
 * Sanitize percentage value
 */
export function sanitizePercentage(input: string | number): {
  sanitized: number | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  return sanitizeNumber(input, {
    min: INPUT_CONSTRAINTS.PERCENTAGE.MIN_VALUE,
    max: INPUT_CONSTRAINTS.PERCENTAGE.MAX_VALUE,
    allowDecimals: true,
    allowNegative: false,
  });
}

/**
 * Create a sanitized input handler for React components
 */
export function createSanitizedInputHandler(
  sanitizer: (input: string) => {
    sanitized: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
  },
  onChange: (
    value: string,
    isValid: boolean,
    errors: string[],
    warnings: string[]
  ) => void
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const result = sanitizer(e.target.value);
    onChange(result.sanitized, result.isValid, result.errors, result.warnings);
  };
}

/**
 * Validate and sanitize form data object
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  schema: Record<
    keyof T,
    (value: any) => {
      sanitized: any;
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }
  >
): {
  sanitized: T;
  isValid: boolean;
  errors: Record<keyof T, string[]>;
  warnings: Record<keyof T, string[]>;
  hasErrors: boolean;
} {
  const sanitized = {} as T;
  const errors = {} as Record<keyof T, string[]>;
  const warnings = {} as Record<keyof T, string[]>;
  let hasErrors = false;

  for (const [key, value] of Object.entries(data)) {
    const sanitizer = schema[key as keyof T];
    if (sanitizer) {
      const result = sanitizer(value);
      sanitized[key as keyof T] = result.sanitized;
      errors[key as keyof T] = result.errors;
      warnings[key as keyof T] = result.warnings;
      if (!result.isValid) {
        hasErrors = true;
      }
    } else {
      sanitized[key as keyof T] = value;
      errors[key as keyof T] = [];
      warnings[key as keyof T] = [];
    }
  }

  return {
    sanitized,
    isValid: !hasErrors,
    errors,
    warnings,
    hasErrors,
  };
}

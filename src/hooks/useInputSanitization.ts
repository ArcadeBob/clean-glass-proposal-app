import { useCallback, useState } from 'react';
import {
  sanitizeAddress,
  sanitizeNotes,
  sanitizeNumber,
  sanitizePercentage,
  sanitizeProjectName,
  sanitizeText,
  sanitizeTextarea,
} from '../lib/input-sanitization';

interface SanitizationResult {
  value: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface NumberSanitizationResult {
  value: number | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Hook for sanitizing text inputs
 */
export function useTextSanitization(
  initialValue: string = '',
  options: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    allowNewlines?: boolean;
  } = {}
) {
  const [result, setResult] = useState<SanitizationResult>(() => {
    const sanitized = sanitizeText(initialValue, options);
    return {
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    };
  });

  const handleChange = useCallback(
    (input: string) => {
      const sanitized = sanitizeText(input, options);
      setResult({
        value: sanitized.sanitized,
        isValid: sanitized.isValid,
        errors: sanitized.errors,
        warnings: sanitized.warnings,
      });
    },
    [options]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  return {
    value: result.value,
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    handleChange,
    handleInputChange,
  };
}

/**
 * Hook for sanitizing number inputs
 */
export function useNumberSanitization(
  initialValue: number | string = '',
  options: {
    min?: number;
    max?: number;
    allowDecimals?: boolean;
    allowNegative?: boolean;
  } = {}
) {
  const [result, setResult] = useState<NumberSanitizationResult>(() => {
    const sanitized = sanitizeNumber(initialValue, options);
    return {
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    };
  });

  const handleChange = useCallback(
    (input: string | number) => {
      const sanitized = sanitizeNumber(input, options);
      setResult({
        value: sanitized.sanitized,
        isValid: sanitized.isValid,
        errors: sanitized.errors,
        warnings: sanitized.warnings,
      });
    },
    [options]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  return {
    value: result.value,
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    handleChange,
    handleInputChange,
  };
}

/**
 * Hook for sanitizing textarea inputs
 */
export function useTextareaSanitization(
  initialValue: string = '',
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    allowUrls?: boolean;
  } = {}
) {
  const [result, setResult] = useState<SanitizationResult>(() => {
    const sanitized = sanitizeTextarea(initialValue, options);
    return {
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    };
  });

  const handleChange = useCallback(
    (input: string) => {
      const sanitized = sanitizeTextarea(input, options);
      setResult({
        value: sanitized.sanitized,
        isValid: sanitized.isValid,
        errors: sanitized.errors,
        warnings: sanitized.warnings,
      });
    },
    [options]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  return {
    value: result.value,
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    handleChange,
    handleInputChange,
  };
}

/**
 * Hook for sanitizing project names
 */
export function useProjectNameSanitization(initialValue: string = '') {
  const [result, setResult] = useState<SanitizationResult>(() => {
    const sanitized = sanitizeProjectName(initialValue);
    return {
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    };
  });

  const handleChange = useCallback((input: string) => {
    const sanitized = sanitizeProjectName(input);
    setResult({
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    });
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  return {
    value: result.value,
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    handleChange,
    handleInputChange,
  };
}

/**
 * Hook for sanitizing addresses
 */
export function useAddressSanitization(initialValue: string = '') {
  const [result, setResult] = useState<SanitizationResult>(() => {
    const sanitized = sanitizeAddress(initialValue);
    return {
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    };
  });

  const handleChange = useCallback((input: string) => {
    const sanitized = sanitizeAddress(input);
    setResult({
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    });
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  return {
    value: result.value,
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    handleChange,
    handleInputChange,
  };
}

/**
 * Hook for sanitizing notes
 */
export function useNotesSanitization(initialValue: string = '') {
  const [result, setResult] = useState<SanitizationResult>(() => {
    const sanitized = sanitizeNotes(initialValue);
    return {
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    };
  });

  const handleChange = useCallback((input: string) => {
    const sanitized = sanitizeNotes(input);
    setResult({
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    });
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  return {
    value: result.value,
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    handleChange,
    handleInputChange,
  };
}

/**
 * Hook for sanitizing percentage values
 */
export function usePercentageSanitization(initialValue: number | string = '') {
  const [result, setResult] = useState<NumberSanitizationResult>(() => {
    const sanitized = sanitizePercentage(initialValue);
    return {
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    };
  });

  const handleChange = useCallback((input: string | number) => {
    const sanitized = sanitizePercentage(input);
    setResult({
      value: sanitized.sanitized,
      isValid: sanitized.isValid,
      errors: sanitized.errors,
      warnings: sanitized.warnings,
    });
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  return {
    value: result.value,
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    handleChange,
    handleInputChange,
  };
}

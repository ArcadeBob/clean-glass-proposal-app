import React from 'react';
import { useTextSanitization } from '../../hooks/useInputSanitization';

interface SanitizedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (
    value: string,
    isValid: boolean,
    errors: string[],
    warnings: string[]
  ) => void;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sanitizationOptions?: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    allowNewlines?: boolean;
  };
  showValidation?: boolean;
  className?: string;
  errorClassName?: string;
  warningClassName?: string;
  successClassName?: string;
}

export const SanitizedInput: React.FC<SanitizedInputProps> = ({
  value: externalValue,
  onChange,
  onInputChange,
  sanitizationOptions = {},
  showValidation = true,
  className = '',
  errorClassName = 'border-red-300 bg-red-50',
  warningClassName = 'border-yellow-300 bg-yellow-50',
  successClassName = 'border-green-300 bg-green-50',
  ...inputProps
}) => {
  const { value, isValid, errors, warnings, handleChange, handleInputChange } =
    useTextSanitization(externalValue || '', sanitizationOptions);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Call the sanitized handler
    handleInputChange(e);

    // Call the external onChange if provided
    if (onChange) {
      onChange(value, isValid, errors, warnings);
    }

    // Call the external onInputChange if provided
    if (onInputChange) {
      onInputChange(e);
    }
  };

  // Determine input styling based on validation state
  const getInputClassName = () => {
    let baseClass = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${className}`;

    if (!showValidation) {
      return baseClass;
    }

    if (errors.length > 0) {
      return `${baseClass} ${errorClassName}`;
    } else if (warnings.length > 0) {
      return `${baseClass} ${warningClassName}`;
    } else if (isValid && value && value.trim().length > 0) {
      return `${baseClass} ${successClassName}`;
    }

    return baseClass;
  };

  return (
    <div className="space-y-1">
      <input
        {...inputProps}
        value={value}
        onChange={handleInput}
        className={getInputClassName()}
      />

      {showValidation && (
        <div className="space-y-1">
          {/* Error Messages */}
          {errors.map((error, index) => (
            <p
              key={`error-${index}`}
              className="text-sm text-red-600 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          ))}

          {/* Warning Messages */}
          {warnings.map((warning, index) => (
            <p
              key={`warning-${index}`}
              className="text-sm text-yellow-600 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {warning}
            </p>
          ))}

          {/* Success Message */}
          {isValid &&
            value &&
            value.trim().length > 0 &&
            errors.length === 0 &&
            warnings.length === 0 && (
              <p className="text-sm text-green-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Input looks good!
              </p>
            )}
        </div>
      )}
    </div>
  );
};

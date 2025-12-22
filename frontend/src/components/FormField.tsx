import React, { useState, useEffect } from 'react';
import {
  TextField,
  TextFieldProps,
  Box,
  Typography,
  Fade,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

interface FormFieldProps extends Omit<TextFieldProps, 'error'> {
  validationRules?: ValidationRule[];
  showValidationFeedback?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  successMessage?: string;
  customError?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  validationRules = [],
  showValidationFeedback = true,
  validateOnChange = true,
  validateOnBlur = true,
  successMessage,
  customError,
  value = '',
  onChange,
  onBlur,
  ...textFieldProps
}) => {
  const [touched, setTouched] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    infos: string[];
  }>({
    isValid: true,
    errors: [],
    warnings: [],
    infos: [],
  });

  const validateField = (fieldValue: string) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const infos: string[] = [];

    validationRules.forEach(rule => {
      if (!rule.test(fieldValue)) {
        switch (rule.severity) {
          case 'warning':
            warnings.push(rule.message);
            break;
          case 'info':
            infos.push(rule.message);
            break;
          default:
            errors.push(rule.message);
        }
      }
    });

    const isValid = errors.length === 0;
    setValidationResults({ isValid, errors, warnings, infos });
    return isValid;
  };

  useEffect(() => {
    if (validateOnChange && touched) {
      validateField(String(value));
    }
  }, [value, validateOnChange, touched, validationRules]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (validateOnChange && touched) {
      validateField(event.target.value);
    }
    onChange?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (validateOnBlur) {
      validateField(event.target.value);
    }
    onBlur?.(event);
  };

  const hasError = customError || (touched && validationResults.errors.length > 0);
  const hasWarning = touched && validationResults.warnings.length > 0;
  const hasSuccess = touched && validationResults.isValid && !customError && String(value).length > 0;

  const getHelperText = () => {
    if (customError) return customError;
    if (touched && validationResults.errors.length > 0) {
      return validationResults.errors[0];
    }
    if (touched && validationResults.warnings.length > 0) {
      return validationResults.warnings[0];
    }
    if (hasSuccess && successMessage) {
      return successMessage;
    }
    return textFieldProps.helperText;
  };

  const getFieldColor = () => {
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    if (hasSuccess) return 'success';
    return textFieldProps.color;
  };

  return (
    <Box>
      <TextField
        {...textFieldProps}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={!!hasError}
        helperText={getHelperText()}
        color={getFieldColor() as any}
        InputProps={{
          ...textFieldProps.InputProps,
          endAdornment: showValidationFeedback && touched && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {hasError && <ErrorIcon color="error" fontSize="small" />}
              {hasWarning && <InfoIcon color="warning" fontSize="small" />}
              {hasSuccess && <CheckIcon color="success" fontSize="small" />}
              {textFieldProps.InputProps?.endAdornment}
            </Box>
          ),
        }}
      />
      
      {showValidationFeedback && touched && (
        <Fade in={true}>
          <Box sx={{ mt: 1 }}>
            {/* Show all validation messages as chips */}
            {validationResults.errors.slice(1).map((error, index) => (
              <Chip
                key={`error-${index}`}
                label={error}
                size="small"
                color="error"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            
            {validationResults.warnings.slice(hasError ? 0 : 1).map((warning, index) => (
              <Chip
                key={`warning-${index}`}
                label={warning}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            
            {validationResults.infos.map((info, index) => (
              <Chip
                key={`info-${index}`}
                label={info}
                size="small"
                color="info"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default FormField;
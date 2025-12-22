import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  TextField
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { RegisterData } from '../types';
import RetryComponent from './RetryComponent';

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    aadhaarNumber: '',
    phone: ''
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  // Validation rules
  const firstNameValidationRules = [
    {
      test: (value: string) => value.trim().length > 0,
      message: 'First name is required',
    },
    {
      test: (value: string) => value.trim().length >= 2,
      message: 'First name must be at least 2 characters long',
    },
  ];

  const lastNameValidationRules = [
    {
      test: (value: string) => value.trim().length > 0,
      message: 'Last name is required',
    },
    {
      test: (value: string) => value.trim().length >= 2,
      message: 'Last name must be at least 2 characters long',
    },
  ];

  const emailValidationRules = [
    {
      test: (value: string) => value.trim().length > 0,
      message: 'Email is required',
    },
    {
      test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Please enter a valid email address',
    },
  ];

  const passwordValidationRules = [
    {
      test: (value: string) => value.length > 0,
      message: 'Password is required',
    },
    {
      test: (value: string) => value.length >= 8,
      message: 'Password must be at least 8 characters long',
    },
    {
      test: (value: string) => /(?=.*[a-z])/.test(value),
      message: 'Password must contain at least one lowercase letter',
      severity: 'warning' as const,
    },
    {
      test: (value: string) => /(?=.*[A-Z])/.test(value),
      message: 'Password must contain at least one uppercase letter',
      severity: 'warning' as const,
    },
    {
      test: (value: string) => /(?=.*\d)/.test(value),
      message: 'Password must contain at least one number',
      severity: 'warning' as const,
    },
  ];

  const confirmPasswordValidationRules = [
    {
      test: (value: string) => value.length > 0,
      message: 'Please confirm your password',
    },
    {
      test: (value: string) => value === formData.password,
      message: 'Passwords do not match',
    },
  ];

  const aadhaarValidationRules = [
    {
      test: (value: string) => value.trim().length > 0,
      message: 'Aadhaar number is required',
    },
    {
      test: (value: string) => /^\d{12}$/.test(value.replace(/\s/g, '')),
      message: 'Aadhaar number must be exactly 12 digits',
    },
    {
      test: () => true,
      message: '12-digit unique identification number',
      severity: 'info' as const,
    },
  ];

  const phoneValidationRules = [
    {
      test: (value: string) => value.trim().length > 0,
      message: 'Phone number is required',
    },
    {
      test: (value: string) => /^\+?[\d\s-()]{10,15}$/.test(value),
      message: 'Please enter a valid phone number',
    },
  ];

  const validateForm = (): boolean => {
    const validations = [
      { rules: firstNameValidationRules, value: formData.firstName },
      { rules: lastNameValidationRules, value: formData.lastName },
      { rules: emailValidationRules, value: formData.email },
      { rules: passwordValidationRules, value: formData.password },
      { rules: confirmPasswordValidationRules, value: formData.confirmPassword },
      { rules: aadhaarValidationRules, value: formData.aadhaarNumber },
      { rules: phoneValidationRules, value: formData.phone },
    ];

    return validations.every(({ rules, value }) =>
      rules.filter(rule => (rule as any).severity !== 'warning').every(rule => rule.test(value))
    );
  };

  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let { value } = e.target;
    
    // Format Aadhaar number with spaces for better readability
    if (field === 'aadhaarNumber') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      if (value.length > 14) { // 12 digits + 2 spaces
        value = value.substring(0, 14);
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the form errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Remove confirmPassword and format aadhaarNumber before sending
      const { confirmPassword, ...registrationData } = formData;
      const dataToSend = {
        ...registrationData,
        aadhaarNumber: registrationData.aadhaarNumber.replace(/\s/g, '') // Remove spaces
      };
      
      await register(dataToSend);
      
      showSuccess('Account created successfully! Welcome to the platform.');
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific error types
      if (error.message) {
        if (error.message.includes('Email already exists') || error.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
        } else if (error.message.includes('Rate limit exceeded') || error.message.includes('Too many requests')) {
          errorMessage = 'Too many attempts. Please wait a moment before trying again.';
        } else if (error.message.includes('Network error') || error.message.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    await handleSubmit(new Event('submit') as any);
  };

  const renderTextField = (
    name: keyof RegisterFormData,
    label: string,
    type: string = 'text',
    placeholder?: string
  ) => (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#1A1A1A',
          fontWeight: 500,
          mb: 1,
          fontSize: '0.875rem'
        }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleInputChange(name)}
        disabled={isSubmitting}
        placeholder={placeholder}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#FAFAFA',
            '& fieldset': {
              borderColor: '#E0E0E0',
            },
            '&:hover fieldset': {
              borderColor: '#CCCCCC',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#9AFF47',
              borderWidth: 2,
            },
            '& input': {
              padding: '12px 16px',
              fontSize: '0.875rem',
            },
          },
        }}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 1, sm: 2 },
        position: 'relative',
        // Add decorative background elements like in the design
        '&::before': {
          content: '""',
          position: 'absolute',
          top: { xs: '5%', sm: '10%' },
          left: { xs: '2%', sm: '5%' },
          width: { xs: '40px', sm: '60px' },
          height: { xs: '40px', sm: '60px' },
          borderRadius: '50%',
          backgroundColor: '#9AFF47',
          opacity: 0.3,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: { xs: '10%', sm: '15%' },
          right: { xs: '4%', sm: '8%' },
          width: { xs: '30px', sm: '40px' },
          height: { xs: '30px', sm: '40px' },
          borderRadius: '8px',
          backgroundColor: '#E0E0E0',
          opacity: 0.5,
        }
      }}
    >
      {/* Additional decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: '15%', sm: '20%' },
          right: { xs: '5%', sm: '10%' },
          width: { xs: '60px', sm: '80px' },
          height: { xs: '60px', sm: '80px' },
          border: '2px solid #E0E0E0',
          borderRadius: '50%',
          opacity: 0.3,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: '20%', sm: '25%' },
          left: { xs: '4%', sm: '8%' },
          width: { xs: '40px', sm: '50px' },
          height: { xs: '40px', sm: '50px' },
          backgroundColor: '#F0F0F0',
          borderRadius: '12px',
          opacity: 0.4,
        }}
      />
      
      <Paper 
        elevation={0} 
        sx={{ 
          width: '100%',
          maxWidth: 500,
          padding: { xs: 3, sm: 4 }, 
          backgroundColor: '#FFFFFF',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E0E0E0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
          <Typography 
            variant="h5" 
            component="h1" 
            gutterBottom
            sx={{ 
              color: '#1A1A1A',
              fontWeight: 600,
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Create Account
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
              color: '#666666',
              px: { xs: 1, sm: 0 }
            }}
          >
            Join our secure platform to manage your profile safely.
          </Typography>
        </Box>
          
          {error && (
            <Box sx={{ mb: 2 }}>
              <RetryComponent
                error={error}
                onRetry={handleRetry}
                retryText="Try Registration Again"
                disabled={isSubmitting}
              />
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mb: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
              <Box sx={{ flex: 1, mb: { xs: 2, sm: 0 } }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1A1A1A',
                    fontWeight: 500,
                    mb: 1,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  First Name
                </Typography>
                <TextField
                  fullWidth
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  disabled={isSubmitting}
                  placeholder="John"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#FAFAFA',
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#CCCCCC',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9AFF47',
                        borderWidth: 2,
                      },
                      '& input': {
                        padding: { xs: '10px 14px', sm: '12px 16px' },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1A1A1A',
                    fontWeight: 500,
                    mb: 1,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Last Name
                </Typography>
                <TextField
                  fullWidth
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  disabled={isSubmitting}
                  placeholder="Doe"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#FAFAFA',
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#CCCCCC',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9AFF47',
                        borderWidth: 2,
                      },
                      '& input': {
                        padding: { xs: '10px 14px', sm: '12px 16px' },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#1A1A1A',
                  fontWeight: 500,
                  mb: 1,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Email Address
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={isSubmitting}
                placeholder="jane.example.com"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#FAFAFA',
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#CCCCCC',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#9AFF47',
                      borderWidth: 2,
                    },
                    '& input': {
                      padding: { xs: '10px 14px', sm: '12px 16px' },
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    },
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
              <Box sx={{ flex: 1, mb: { xs: 2, sm: 0 } }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1A1A1A',
                    fontWeight: 500,
                    mb: 1,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Password
                </Typography>
                <TextField
                  fullWidth
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#FAFAFA',
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#CCCCCC',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9AFF47',
                        borderWidth: 2,
                      },
                      '& input': {
                        padding: { xs: '10px 14px', sm: '12px 16px' },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1A1A1A',
                    fontWeight: 500,
                    mb: 1,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Confirm Password
                </Typography>
                <TextField
                  fullWidth
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#FAFAFA',
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#CCCCCC',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9AFF47',
                        borderWidth: 2,
                      },
                      '& input': {
                        padding: { xs: '10px 14px', sm: '12px 16px' },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
              <Box sx={{ flex: 1, mb: { xs: 2, sm: 0 } }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1A1A1A',
                    fontWeight: 500,
                    mb: 1,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Aadhaar Number
                </Typography>
                <TextField
                  fullWidth
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleInputChange('aadhaarNumber')}
                  disabled={isSubmitting}
                  placeholder="1234 5678 9012"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#FAFAFA',
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#CCCCCC',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9AFF47',
                        borderWidth: 2,
                      },
                      '& input': {
                        padding: { xs: '10px 14px', sm: '12px 16px' },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1A1A1A',
                    fontWeight: 500,
                    mb: 1,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Phone Number
                </Typography>
                <TextField
                  fullWidth
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  disabled={isSubmitting}
                  placeholder="+91 98765 43210"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#FAFAFA',
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#CCCCCC',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9AFF47',
                        borderWidth: 2,
                      },
                      '& input': {
                        padding: { xs: '10px 14px', sm: '12px 16px' },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mb: { xs: 1.5, sm: 2 },
                py: { xs: 1.2, sm: 1.5 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 600,
                borderRadius: '28px',
                textTransform: 'none',
                backgroundColor: '#2C3E50',
                color: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid #2C3E50',
                // Remove any transform effects that cause floating
                '&:hover': {
                  transform: 'none',
                  boxShadow: 'none',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#9AFF47',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  transformOrigin: 'center',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 0,
                },
                '&:hover:not(:disabled)::before': {
                  transform: 'scale(35)',
                },
                '&:hover:not(:disabled)': {
                  backgroundColor: '#2C3E50',
                  borderColor: '#9AFF47',
                  color: '#000000',
                  '& .button-text': {
                    color: '#000000',
                    position: 'relative',
                    zIndex: 1,
                  }
                },
                '&:disabled': {
                  backgroundColor: '#E0E0E0',
                  color: '#9E9E9E',
                  borderColor: '#E0E0E0',
                  '&::before': {
                    display: 'none',
                  }
                },
              }}
              disabled={isSubmitting || !validateForm()}
            >
              <span className="button-text" style={{ position: 'relative', zIndex: 1 }}>
                {isSubmitting ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </span>
            </Button>

            <Box sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  color: '#666666',
                }}
              >
                🔒 Your data is encrypted and securely stored
              </Typography>
            </Box>
          </Box>

          <Box textAlign="center">
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 0,
                color: '#666666', 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                px: { xs: 1, sm: 0 }
              }}
            >
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  textDecoration: 'none',
                  color: '#9AFF47',
                  fontWeight: 500
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
    </Box>
  );
};

export default RegisterForm;
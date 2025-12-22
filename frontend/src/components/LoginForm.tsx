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

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  // Validation rules
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
      test: (value: string) => value.length >= 6,
      message: 'Password must be at least 6 characters long',
    },
  ];

  const validateForm = (): boolean => {
    const emailValid = emailValidationRules.every(rule => rule.test(formData.email));
    const passwordValid = passwordValidationRules.every(rule => rule.test(formData.password));
    return emailValid && passwordValid;
  };

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;
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
      setError('Please enter valid email and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      
      showSuccess('Login successful! Welcome back.');
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle specific error types for better user feedback
      if (error.message) {
        if (error.message.includes('Invalid credentials') || 
            error.message.includes('Unauthorized') ||
            error.message.includes('401')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('User not found') || 
                   error.message.includes('No user found')) {
          errorMessage = 'No account found with this email address. Please check your email or create a new account.';
        } else if (error.message.includes('Rate limit exceeded') || 
                   error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
        } else if (error.message.includes('Network error') || 
                   error.message.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('Server error') || 
                   error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
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
          maxWidth: 400,
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
            Welcome Back
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
            Enter your credentials to access your drive.
          </Typography>
        </Box>
          
          {error && (
            <Box 
              sx={{ 
                mb: 3,
                p: 2,
                backgroundColor: '#FFF5F5',
                border: '1px solid #FED7D7',
                borderRadius: 2,
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#C53030',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}
              >
                {error}
              </Typography>
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mb: { xs: 2, sm: 3 } }}>
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
                autoComplete="email"
                autoFocus
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
                Password
              </Typography>
              <TextField
                fullWidth
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                disabled={isSubmitting}
                autoComplete="current-password"
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
              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#9AFF47',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Forgot?
                </Typography>
              </Box>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mb: { xs: 2, sm: 3 },
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
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </span>
            </Button>
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
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={{ 
                  textDecoration: 'none',
                  color: '#9AFF47',
                  fontWeight: 500
                }}
              >
                Create one
              </Link>
            </Typography>
          </Box>
        </Paper>
    </Box>
  );
};

export default LoginForm;
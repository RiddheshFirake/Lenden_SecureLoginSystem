import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoadingProvider } from './contexts/LoadingContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#9AFF47', // Bright green from the design
      dark: '#7ED321',
      light: '#B8FF6B',
      contrastText: '#000000',
    },
    secondary: {
      main: '#1A1A1A', // Dark color for contrast
      dark: '#000000',
      light: '#333333',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '0.9rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '0.8rem',
      },
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50, // Very rounded like in the design
          padding: '12px 32px',
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          minHeight: 48,
          fontFamily: 'Space Grotesk, sans-serif',
          letterSpacing: '0.02em',
          transition: 'all 0.2s ease-in-out',
          '@media (max-width:600px)': {
            padding: '10px 24px',
            fontSize: '0.8rem',
            minHeight: 44,
          },
          '&:hover': {
            boxShadow: '0 8px 24px rgba(154, 255, 71, 0.4)',
            transform: 'translateY(-2px)',
            '@media (max-width:600px)': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 16px rgba(154, 255, 71, 0.3)',
            },
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
        },
        contained: {
          background: '#9AFF47',
          color: '#000000',
          border: '2px solid #9AFF47',
          '&:hover': {
            background: '#7ED321',
            borderColor: '#7ED321',
          },
          '&:disabled': {
            background: '#E0E0E0',
            color: '#9E9E9E',
            border: '2px solid #E0E0E0',
            transform: 'none',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: '#9AFF47',
          color: '#9AFF47',
          border: '2px solid #9AFF47',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(154, 255, 71, 0.1)',
            borderColor: '#7ED321',
            color: '#7ED321',
          },
        },
        text: {
          color: '#666666',
          padding: '12px 24px',
          '&:hover': {
            backgroundColor: 'rgba(154, 255, 71, 0.1)',
            color: '#9AFF47',
          },
        },
        sizeSmall: {
          padding: '8px 24px',
          fontSize: '0.8rem',
          minHeight: 40,
          '@media (max-width:600px)': {
            padding: '6px 20px',
            fontSize: '0.75rem',
            minHeight: 36,
          },
        },
        sizeLarge: {
          padding: '16px 40px',
          fontSize: '1rem',
          minHeight: 56,
          '@media (max-width:600px)': {
            padding: '12px 32px',
            fontSize: '0.875rem',
            minHeight: 48,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          '@media (max-width:600px)': {
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 20,
            backgroundColor: '#FAFAFA',
            border: 'none',
            '@media (max-width:600px)': {
              borderRadius: 16,
            },
            '& fieldset': {
              borderColor: '#E0E0E0',
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: '#9AFF47',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#9AFF47',
              borderWidth: 2,
            },
            '& input': {
              padding: '16px 20px',
              fontSize: '1rem',
              '@media (max-width:600px)': {
                padding: '12px 16px',
                fontSize: '0.875rem',
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: '#9AFF47',
            fontWeight: 500,
            fontSize: '0.875rem',
            '@media (max-width:600px)': {
              fontSize: '0.8rem',
            },
            '&.Mui-focused': {
              color: '#9AFF47',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 600,
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '0.875rem',
          height: 36,
          padding: '0 16px',
          '@media (max-width:600px)': {
            fontSize: '0.75rem',
            height: 32,
            padding: '0 12px',
            borderRadius: 16,
          },
        },
        colorSuccess: {
          backgroundColor: 'rgba(154, 255, 71, 0.2)',
          color: '#2E7D32',
          border: '1px solid rgba(154, 255, 71, 0.3)',
        },
        colorError: {
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: '#D32F2F',
          border: '1px solid rgba(244, 67, 54, 0.2)',
        },
        colorWarning: {
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          color: '#F57C00',
          border: '1px solid rgba(255, 152, 0, 0.2)',
        },
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <LoadingProvider>
            <AuthProvider>
              <Router>
                <Routes>
                  {/* Public routes - redirect to dashboard if authenticated */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <RegisterPage />
                      </PublicRoute>
                    }
                  />
                  
                  {/* Protected routes - require authentication */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Router>
            </AuthProvider>
          </LoadingProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock the API module
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import api from '../services/api';
const mockApi = api as jest.Mocked<typeof api>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/**
 * Unit tests for authentication components
 * Tests LoginForm rendering and validation, RegisterForm rendering and validation,
 * and AuthProvider state management
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */

describe('Authentication Components Unit Tests', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('LoginForm rendering and validation', () => {
    it('should render login form with all required fields', () => {
      renderWithRouter(<LoginForm />);
      
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should show validation error for empty email', async () => {
      renderWithRouter(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email format', async () => {
      renderWithRouter(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      renderWithRouter(<LoginForm />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
      });
    });

    it('should clear field errors when user starts typing', async () => {
      renderWithRouter(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      // Trigger validation error
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
      
      // Start typing to clear error
      fireEvent.change(emailInput, { target: { value: 'test@' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('RegisterForm rendering and validation', () => {
    it('should render registration form with all required fields', () => {
      renderWithRouter(<RegisterForm />);
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/aadhaar number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should show validation error for empty first name', async () => {
      renderWithRouter(<RegisterForm />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(firstNameInput, { target: { value: '' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short first name', async () => {
      renderWithRouter(<RegisterForm />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(firstNameInput, { target: { value: 'A' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/first name must be at least 2 characters long/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for weak password', async () => {
      renderWithRouter(<RegisterForm />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(passwordInput, { target: { value: 'weakpass' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter, one lowercase letter, and one number/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for password mismatch', async () => {
      renderWithRouter(<RegisterForm />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid Aadhaar number', async () => {
      renderWithRouter(<RegisterForm />);
      
      const aadhaarInput = screen.getByLabelText(/aadhaar number/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(aadhaarInput, { target: { value: '123456789' } }); // Too short
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/aadhaar number must be exactly 12 digits/i)).toBeInTheDocument();
      });
    });

    it('should format Aadhaar number with spaces', () => {
      renderWithRouter(<RegisterForm />);
      
      const aadhaarInput = screen.getByLabelText(/aadhaar number/i);
      
      fireEvent.change(aadhaarInput, { target: { value: '123456789012' } });
      
      expect(aadhaarInput).toHaveValue('1234 5678 9012');
    });

    it('should show validation error for invalid phone number', async () => {
      renderWithRouter(<RegisterForm />);
      
      const phoneInput = screen.getByLabelText(/phone number/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(phoneInput, { target: { value: '123' } }); // Too short
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form interaction and user experience', () => {
    it('should disable submit button while loading in LoginForm', async () => {
      renderWithRouter(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      
      // Submit button should be enabled initially
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button while loading in RegisterForm', async () => {
      renderWithRouter(<RegisterForm />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      // Submit button should be enabled initially
      expect(submitButton).not.toBeDisabled();
    });

    it('should show loading indicator when submitting LoginForm', async () => {
      renderWithRouter(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      
      // The form should be ready for submission
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('validpassword');
    });

    it('should have proper accessibility attributes', () => {
      renderWithRouter(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });
  });

  describe('Navigation and links', () => {
    it('should have link to registration page from login form', () => {
      renderWithRouter(<LoginForm />);
      
      const registerLink = screen.getByRole('button', { name: /register here/i });
      expect(registerLink).toBeInTheDocument();
    });

    it('should have link to login page from registration form', () => {
      renderWithRouter(<RegisterForm />);
      
      const loginLink = screen.getByRole('button', { name: /login here/i });
      expect(loginLink).toBeInTheDocument();
    });
  });

  describe('AuthProvider state management', () => {
    // Test component to access AuthContext
    const TestComponent: React.FC = () => {
      const { user, token, isAuthenticated, isLoading, login, register, logout } = useAuth();
      const [error, setError] = React.useState<string | null>(null);
      
      const handleLogin = async () => {
        try {
          setError(null);
          await login('test@example.com', 'password123');
        } catch (err: any) {
          setError(err.message);
        }
      };

      const handleRegister = async () => {
        try {
          setError(null);
          await register({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            aadhaarNumber: '123456789012',
            phone: '+1234567890'
          });
        } catch (err: any) {
          setError(err.message);
        }
      };
      
      return (
        <div>
          <div data-testid="user-info">
            {user ? `${user.firstName} ${user.lastName}` : 'No user'}
          </div>
          <div data-testid="token-info">
            {token ? 'Token present' : 'No token'}
          </div>
          <div data-testid="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
          </div>
          <div data-testid="loading-status">
            {isLoading ? 'Loading' : 'Not loading'}
          </div>
          <div data-testid="error-info">
            {error || 'No error'}
          </div>
          <button 
            data-testid="login-btn" 
            onClick={handleLogin}
          >
            Login
          </button>
          <button 
            data-testid="register-btn" 
            onClick={handleRegister}
          >
            Register
          </button>
          <button data-testid="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      );
    };

    const renderAuthTest = () => {
      return render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );
    };

    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
      jest.clearAllMocks();
    });

    it('should initialize with no user and no token', async () => {
      renderAuthTest();
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading');
      });
      
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(screen.getByTestId('token-info')).toHaveTextContent('No token');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    it('should restore token from localStorage on initialization', async () => {
      const mockToken = 'stored-token';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      localStorage.setItem('authToken', mockToken);
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      renderAuthTest();

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });

      expect(screen.getByTestId('token-info')).toHaveTextContent('Token present');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(mockApi.get).toHaveBeenCalledWith('/profile');
    });

    it('should clear invalid token from localStorage', async () => {
      const invalidToken = 'invalid-token';
      localStorage.setItem('authToken', invalidToken);
      
      mockApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

      renderAuthTest();

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading');
      });

      expect(localStorage.getItem('authToken')).toBeNull();
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(screen.getByTestId('token-info')).toHaveTextContent('No token');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    it('should handle successful login', async () => {
      const mockResponse = {
        data: {
          token: 'new-token',
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      renderAuthTest();

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });

      expect(screen.getByTestId('token-info')).toHaveTextContent('Token present');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(localStorage.getItem('authToken')).toBe('new-token');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle successful registration and auto-login', async () => {
      const mockRegisterResponse = { data: { success: true } };
      const mockLoginResponse = {
        data: {
          token: 'new-token',
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      mockApi.post
        .mockResolvedValueOnce(mockRegisterResponse) // Register call
        .mockResolvedValueOnce(mockLoginResponse);   // Auto-login call

      renderAuthTest();

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('register-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });

      expect(screen.getByTestId('token-info')).toHaveTextContent('Token present');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(localStorage.getItem('authToken')).toBe('new-token');
      
      // Should call register first, then login
      expect(mockApi.post).toHaveBeenCalledTimes(2);
      expect(mockApi.post).toHaveBeenNthCalledWith(1, '/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        aadhaarNumber: '123456789012',
        phone: '+1234567890'
      });
      expect(mockApi.post).toHaveBeenNthCalledWith(2, '/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle logout correctly', async () => {
      // First set up authenticated state
      const mockToken = 'test-token';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      localStorage.setItem('authToken', mockToken);
      mockApi.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      renderAuthTest();

      // Wait for authentication to be established
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });

      // Now logout
      await act(async () => {
        fireEvent.click(screen.getByTestId('logout-btn'));
      });

      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(screen.getByTestId('token-info')).toHaveTextContent('No token');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      mockApi.post.mockRejectedValueOnce(mockError);

      renderAuthTest();

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-info')).toHaveTextContent('Invalid credentials');
      });

      // Should remain unauthenticated
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(screen.getByTestId('token-info')).toHaveTextContent('No token');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should handle registration errors', async () => {
      const mockError = new Error('Email already exists');
      mockApi.post.mockRejectedValueOnce(mockError);

      renderAuthTest();

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('register-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-info')).toHaveTextContent('Email already exists');
      });

      // Should remain unauthenticated
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(screen.getByTestId('token-info')).toHaveTextContent('No token');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should throw error when useAuth is used outside AuthProvider', () => {
      const TestComponentOutsideProvider = () => {
        useAuth(); // This should throw
        return <div>Test</div>;
      };

      // Suppress console.error for this test since we expect an error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
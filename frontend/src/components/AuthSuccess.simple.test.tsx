import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from './LoginForm';

// Mock the entire AuthContext
const mockLogin = jest.fn();
const mockAuthContext = {
  user: null,
  token: null,
  login: mockLogin,
  register: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  isAuthenticated: false,
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/**
 * Feature: secure-user-profile-system, Property 12: Authentication success flow
 * Validates: Requirements 4.4
 * 
 * Property: For any successful login through the frontend, the system should 
 * store the JWT token securely and redirect to the profile dashboard
 */

describe('Property 12: Authentication success flow (Simple)', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const renderLoginForm = () => {
    return render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
  };

  it('should redirect to dashboard on successful login', async () => {
    // Mock successful login
    mockLogin.mockResolvedValueOnce({
      token: 'test-token',
      user: { id: 1, email: 'test@example.com' }
    });

    const { container } = renderLoginForm();
    
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Fill form with valid data
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Verify login was called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'validpassword123');
    });

    // Verify navigation to dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle successful login with different valid credentials', async () => {
    const testCases = [
      { email: 'user@domain.com', password: 'password123' },
      { email: 'admin@company.org', password: 'securepass456' },
      { email: 'test.user@example.co.uk', password: 'mypassword789' }
    ];

    for (const credentials of testCases) {
      // Reset mocks for each test case
      jest.clearAllMocks();
      
      // Mock successful login
      mockLogin.mockResolvedValueOnce({
        token: 'test-token',
        user: { id: 1, email: credentials.email }
      });

      const { container, unmount } = renderLoginForm();
      
      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
      const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      // Fill form
      fireEvent.change(emailInput, { target: { value: credentials.email } });
      fireEvent.change(passwordInput, { target: { value: credentials.password } });
      
      // Submit form
      fireEvent.click(submitButton);

      // Verify login was called with correct credentials
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(credentials.email, credentials.password);
      });

      // Verify navigation to dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      // Clean up for next iteration
      unmount();
    }
  });

  it('should call login function with exact credentials provided', async () => {
    const email = 'precise@test.com';
    const password = 'exactpassword';
    
    mockLogin.mockResolvedValueOnce({
      token: 'success-token',
      user: { id: 1, email }
    });

    const { container } = renderLoginForm();
    
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(passwordInput, { target: { value: password } });
    fireEvent.click(submitButton);

    // Verify exact credentials were passed
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(email, password);
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    // Verify successful navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
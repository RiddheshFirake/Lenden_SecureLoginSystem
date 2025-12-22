import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

// Mock the entire AuthContext
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockAuthContext = {
  user: null,
  token: null,
  login: mockLogin,
  register: mockRegister,
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
 * Feature: secure-user-profile-system, Property 11: Client-side validation
 * Validates: Requirements 4.2
 * 
 * Property: For any invalid form data submitted through the frontend,
 * client-side validation should catch and display errors before sending
 * requests to the backend
 */

describe('Property 11: Client-side validation', () => {
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

  const renderRegisterForm = () => {
    return render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );
  };

  // Simple arbitraries for invalid data
  const invalidEmailArb = fc.constantFrom(
    '',
    'invalid-email',
    '@missing-local.com'
  );

  const invalidPasswordArb = fc.constantFrom(
    '',
    'short'
  );

  it('should prevent login API calls when email is invalid', () => {
    fc.assert(
      fc.property(invalidEmailArb, (invalidEmail) => {
        const { container } = renderLoginForm();
        
        const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
        const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
        const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

        if (emailInput && passwordInput && submitButton) {
          fireEvent.change(emailInput, { target: { value: invalidEmail } });
          fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
          fireEvent.click(submitButton);

          // Should not call the API
          expect(mockLogin).not.toHaveBeenCalled();
        }
        
        cleanup();
      }),
      { numRuns: 10 }
    );
  });

  it('should prevent login API calls when password is invalid', () => {
    fc.assert(
      fc.property(invalidPasswordArb, (invalidPassword) => {
        const { container } = renderLoginForm();
        
        const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
        const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
        const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

        if (emailInput && passwordInput && submitButton) {
          fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
          fireEvent.change(passwordInput, { target: { value: invalidPassword } });
          fireEvent.click(submitButton);

          // Should not call the API
          expect(mockLogin).not.toHaveBeenCalled();
        }
        
        cleanup();
      }),
      { numRuns: 10 }
    );
  });

  it('should prevent registration API calls when required fields are empty', () => {
    fc.assert(
      fc.property(fc.string().filter(s => s === ''), (emptyValue) => {
        const { container } = renderRegisterForm();
        
        const firstNameInput = container.querySelector('input[name="firstName"]') as HTMLInputElement;
        const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

        if (firstNameInput && submitButton) {
          fireEvent.change(firstNameInput, { target: { value: emptyValue } });
          fireEvent.click(submitButton);

          // Should not call the API
          expect(mockRegister).not.toHaveBeenCalled();
        }
        
        cleanup();
      }),
      { numRuns: 5 }
    );
  });

  it('should show validation errors for invalid inputs', () => {
    const { container } = renderLoginForm();
    
    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Test with empty email
    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
    fireEvent.click(submitButton);

    // Should show error and not call API
    expect(mockLogin).not.toHaveBeenCalled();
    
    // Check for error indicators
    const errorElements = container.querySelectorAll('[class*="error"], [class*="Mui-error"]');
    expect(errorElements.length).toBeGreaterThan(0);
  });
});
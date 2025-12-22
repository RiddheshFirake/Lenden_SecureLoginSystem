/**
 * Unit tests for Profile Components
 * Tests ProfileDashboard and ProfileDisplay components
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfileDashboard from './ProfileDashboard';
import ProfileDisplay from './ProfileDisplay';
import ErrorBoundary from './ErrorBoundary';
import api from '../services/api';
import { User } from '../types';

// Mock the api module
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => {
  const actual = jest.requireActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: jest.fn(),
  };
});

import { useAuth } from '../contexts/AuthContext';
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProfileDisplay Component', () => {
  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    aadhaarNumber: '123456789012',
    phone: '+91 98765 43210',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  it('should render user data correctly', () => {
    render(<ProfileDisplay user={mockUser} />);

    // Check if user name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check if email is displayed
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Check if phone is displayed
    expect(screen.getByText('+91 98765 43210')).toBeInTheDocument();
    
    // Check if Aadhaar number is masked (only last 4 digits shown)
    expect(screen.getByText(/XXXX-XXXX-9012/)).toBeInTheDocument();
  });

  it('should display "Verified Profile" chip', () => {
    render(<ProfileDisplay user={mockUser} />);
    
    expect(screen.getByText('Verified Profile')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<ProfileDisplay user={mockUser} />);
    
    // Check if the date is formatted (should contain "January" and "2024")
    expect(screen.getByText(/January.*2024/)).toBeInTheDocument();
  });

  it('should handle missing optional fields', () => {
    const userWithoutOptionalFields: User = {
      id: '123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    render(<ProfileDisplay user={userWithoutOptionalFields} />);
    
    // Should display N/A for missing fields
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('should display profile ID', () => {
    render(<ProfileDisplay user={mockUser} />);
    
    expect(screen.getByText('123')).toBeInTheDocument();
  });
});

describe('ProfileDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render loading state initially', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      token: 'mock-token',
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    mockedApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading your profile/i)).toBeInTheDocument();
  });

  it('should render profile data after successful fetch', async () => {
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      aadhaarNumber: '123456789012',
      phone: '+91 98765 43210',
    };

    mockedUseAuth.mockReturnValue({
      user: mockUser,
      token: 'mock-token',
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    mockedApi.get.mockResolvedValueOnce({
      data: { user: mockUser },
    });

    render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      token: 'mock-token',
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    mockedApi.get.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { message: 'Server error' },
      },
    });

    render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Server error occurred/i)).toBeInTheDocument();
    });
  });

  it('should have a logout button', async () => {
    const mockLogout = jest.fn();

    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      token: 'mock-token',
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    mockedApi.get.mockResolvedValueOnce({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    });

    render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const logoutButton = screen.getByText(/Logout/i);
      expect(logoutButton).toBeInTheDocument();
    });

    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should have a refresh button', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      token: 'mock-token',
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    mockedApi.get.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    });

    render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    const refreshButtons = screen.getAllByText(/Refresh/i);
    expect(refreshButtons.length).toBeGreaterThan(0);
  });

  it('should show not authenticated message when user is not authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      logout: jest.fn(),
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/You are not authenticated/i)).toBeInTheDocument();
  });
});

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  const ThrowError = () => {
    throw new Error('Test error');
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('should have a "Try Again" button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
  });

  it('should have a "Reload Page" button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Reload Page/i)).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });
});

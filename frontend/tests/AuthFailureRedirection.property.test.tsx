/**
 * Feature: secure-user-profile-system, Property 14: Authentication failure redirection
 * Validates: Requirements 5.4
 * 
 * Property: For any authentication failure in the profile dashboard, the user should be 
 * redirected to the login page
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import * as fc from 'fast-check';
import api from '../services/api';

// Mock the api module
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Import after mocking
import ProfileDashboard from './ProfileDashboard';

// Mock the AuthContext to provide authenticated state
jest.mock('../contexts/AuthContext', () => {
  const actual = jest.requireActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      token: 'mock-token',
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    }),
  };
});

describe('Property 14: Authentication failure redirection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
    // Set initial token
    localStorage.setItem('authToken', 'mock-token');
  });

  it('should redirect to login page when authentication fails (401 error)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          message: fc.string({ minLength: 5, maxLength: 100 }),
        }),
        async (errorData) => {
          // Mock the API to return 401 error
          mockedApi.get.mockRejectedValueOnce({
            response: {
              status: 401,
              data: errorData,
            },
          });

          // Render the component
          render(
            <BrowserRouter>
              <ProfileDashboard />
            </BrowserRouter>
          );

          // Wait for the API call and error handling
          await waitFor(
            () => {
              // The api interceptor should have cleared the token
              const token = localStorage.getItem('authToken');
              expect(token).toBeNull();
            },
            { timeout: 2000 }
          );

          // Verify that the window location was changed to /login
          // Note: The api interceptor handles this redirection
          expect(window.location.href).toContain('/login');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle authentication failures consistently', async () => {
    // Mock the API to return 401 error
    mockedApi.get.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    });

    // Render the component
    render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    // Wait for the API call and error handling
    await waitFor(
      () => {
        // The api interceptor should have cleared the token
        const token = localStorage.getItem('authToken');
        expect(token).toBeNull();
      },
      { timeout: 2000 }
    );

    // Verify that the window location was changed to /login
    expect(window.location.href).toContain('/login');
  });

  it('should clear authentication state on 401 errors', async () => {
    // Set initial token
    localStorage.setItem('authToken', 'valid-token');

    // Mock the API to return 401 error
    mockedApi.get.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Token expired' },
      },
    });

    // Render the component
    render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    // Wait for the API call and error handling
    await waitFor(
      () => {
        // The token should be cleared from localStorage
        const token = localStorage.getItem('authToken');
        expect(token).toBeNull();
      },
      { timeout: 2000 }
    );
  });
});

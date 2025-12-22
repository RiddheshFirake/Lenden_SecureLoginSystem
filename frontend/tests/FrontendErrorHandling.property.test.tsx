/**
 * Feature: secure-user-profile-system, Property 13: Frontend error handling
 * Validates: Requirements 4.5, 5.5
 * 
 * Property: For any API error encountered by the frontend, appropriate user-friendly 
 * error messages should be displayed
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import ProfileDashboard from './ProfileDashboard';
import api from '../services/api';

// Mock the api module
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

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

describe('Property 13: Frontend error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display user-friendly error messages for various API errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Generate different types of API errors
          fc.record({
            type: fc.constant('401'),
            response: fc.record({
              status: fc.constant(401),
              data: fc.record({
                message: fc.constant('Authentication failed'),
              }),
            }),
          }),
          fc.record({
            type: fc.constant('500'),
            response: fc.record({
              status: fc.constant(500),
              data: fc.record({
                message: fc.constant('Internal server error'),
              }),
            }),
          }),
          fc.record({
            type: fc.constant('timeout'),
            code: fc.constant('ECONNABORTED'),
            message: fc.constant('timeout of 10000ms exceeded'),
          })
        ),
        async (errorConfig) => {
          // Mock the API to reject with the generated error
          mockedApi.get.mockRejectedValueOnce(errorConfig);

          // Render the component
          const { container } = render(
            <BrowserRouter>
              <ProfileDashboard />
            </BrowserRouter>
          );

          // Wait for the error to be displayed
          await waitFor(
            () => {
              const alerts = container.querySelectorAll('[role="alert"]');
              expect(alerts.length).toBeGreaterThan(0);
            },
            { timeout: 2000 }
          );

          // Verify that an error message is displayed
          const alerts = container.querySelectorAll('[role="alert"]');
          expect(alerts.length).toBeGreaterThan(0);

          // Check that the error message is user-friendly (not empty and contains text)
          const errorText = Array.from(alerts)
            .map((alert) => alert.textContent)
            .join(' ');
          
          expect(errorText.length).toBeGreaterThan(0);
          
          // Verify error message doesn't expose sensitive technical details
          expect(errorText).not.toContain('undefined');
          expect(errorText).not.toContain('null');
          
          // Verify that appropriate error messages are shown based on error type
          if (errorConfig.type === '401') {
            expect(errorText).toMatch(/authentication|log in/i);
          } else if (errorConfig.type === '500') {
            expect(errorText).toMatch(/server error|try again later/i);
          } else if (errorConfig.type === 'timeout') {
            expect(errorText).toMatch(/timeout|connection|try again/i);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should provide retry options when errors occur', async () => {
    // Mock the API to reject with a server error
    mockedApi.get.mockRejectedValueOnce({ 
      response: { 
        status: 500, 
        data: { message: 'Server error' } 
      } 
    });

    // Render the component
    const { container } = render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    // Wait for the error to be displayed
    await waitFor(
      () => {
        const alerts = container.querySelectorAll('[role="alert"]');
        expect(alerts.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    // Verify that a retry button or option is available
    const retryButton = screen.queryByText(/retry/i);
    expect(retryButton).toBeTruthy();
  });

  it('should handle errors without crashing the application', async () => {
    // Mock the API to reject with a random error
    mockedApi.get.mockRejectedValueOnce(new Error('Random error'));

    // Render the component - it should not crash
    const { container } = render(
      <BrowserRouter>
        <ProfileDashboard />
      </BrowserRouter>
    );

    // Wait a bit for rendering
    await waitFor(() => {
      // Component should still be mounted
      expect(container).toBeTruthy();
    }, { timeout: 1000 });

    // The component should either show an error or be in a valid state
    // It should not crash or throw unhandled errors
    expect(container.innerHTML).toBeTruthy();
  });
});

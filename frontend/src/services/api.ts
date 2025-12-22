import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000');
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced error types for better error handling
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  field?: string;
  retryable?: boolean;
}

// Helper function to determine if an error is retryable
const isRetryableError = (error: AxiosError, config?: AxiosRequestConfig): boolean => {
  // Don't retry authentication-related requests
  const isAuthRequest = config?.url?.includes('/auth/login') || 
                       config?.url?.includes('/auth/register') ||
                       config?.url?.includes('/profile/verify-password');
  
  if (isAuthRequest) {
    return false;
  }

  if (!error.response) {
    // Network errors are retryable for non-auth requests
    return true;
  }
  
  const status = error.response.status;
  // Retry on server errors (5xx) and rate limiting (429)
  return status >= 500 || status === 429;
};

// Helper function to create standardized error messages
const createApiError = (error: AxiosError): ApiError => {
  console.log('createApiError called with:', {
    hasResponse: !!error.response,
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
    code: error.code
  });

  if (!error.response) {
    // Network error
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out. Please check your internet connection and try again.',
        code: 'TIMEOUT',
        retryable: true,
      };
    }
    return {
      message: 'Network error. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
      retryable: true,
    };
  }

  const status = error.response.status;
  const data = error.response.data as any;

  switch (status) {
    case 400:
      return {
        message: data?.message || 'Invalid request. Please check your input and try again.',
        status,
        code: 'BAD_REQUEST',
        retryable: false,
      };
    case 401:
      return {
        message: data?.message || 'Authentication failed. Please check your credentials.',
        status,
        code: 'UNAUTHORIZED',
        retryable: false,
      };
    case 403:
      return {
        message: 'Access denied. You do not have permission to perform this action.',
        status,
        code: 'FORBIDDEN',
        retryable: false,
      };
    case 404:
      return {
        message: 'The requested resource was not found.',
        status,
        code: 'NOT_FOUND',
        retryable: false,
      };
    case 409:
      return {
        message: data?.message || 'This email is already registered. Please use a different email or try logging in.',
        status,
        code: 'CONFLICT',
        retryable: false,
      };
    case 429:
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        status,
        code: 'RATE_LIMITED',
        retryable: true,
      };
    case 500:
      return {
        message: 'Server error occurred. Please try again later.',
        status,
        code: 'SERVER_ERROR',
        retryable: true,
      };
    default:
      return {
        message: data?.message || 'An unexpected error occurred. Please try again.',
        status,
        code: 'UNKNOWN_ERROR',
        retryable: status >= 500,
      };
  }
};

// Retry mechanism with exponential backoff
const retryRequest = async (
  config: AxiosRequestConfig,
  retryCount: number = 0
): Promise<AxiosResponse> => {
  console.log('retryRequest called:', { url: config.url, retryCount });
  
  try {
    return await api.request(config);
  } catch (error) {
    console.log('retryRequest caught error:', {
      error,
      hasCodeAndMessage: error && typeof error === 'object' && 'code' in error && 'message' in error,
      type: typeof error
    });
    
    // Check if this is already a transformed ApiError
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      // This is already a transformed ApiError from the interceptor
      const apiError = error as ApiError;
      console.log('Already transformed ApiError:', apiError);
      
      if (retryCount < MAX_RETRIES && apiError.retryable) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryRequest(config, retryCount + 1);
      }
      
      throw apiError;
    }
    
    // This is a raw axios error, transform it
    const axiosError = error as AxiosError;
    console.log('Raw axios error, transforming:', axiosError);
    
    if (retryCount < MAX_RETRIES && isRetryableError(axiosError, config)) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(config, retryCount + 1);
    }
    
    throw createApiError(axiosError);
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(createApiError(error));
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = createApiError(error);
    
    if (apiError.status === 401) {
      // Don't auto-logout for password verification or login failures
      const isPasswordVerification = error.config?.url?.includes('/profile/verify-password');
      const isLoginAttempt = error.config?.url?.includes('/auth/login');
      
      if (!isPasswordVerification && !isLoginAttempt) {
        // Clear token and redirect to login on unauthorized
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(apiError);
  }
);

// Enhanced API methods with retry support
export const apiWithRetry = {
  get: (url: string, config?: AxiosRequestConfig) => 
    retryRequest({ ...config, method: 'GET', url }),
  
  post: (url: string, data?: any, config?: AxiosRequestConfig) => 
    retryRequest({ ...config, method: 'POST', url, data }),
  
  put: (url: string, data?: any, config?: AxiosRequestConfig) => 
    retryRequest({ ...config, method: 'PUT', url, data }),
  
  delete: (url: string, config?: AxiosRequestConfig) => 
    retryRequest({ ...config, method: 'DELETE', url }),
};

export default api;
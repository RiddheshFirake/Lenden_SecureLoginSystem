import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  // Handle specific error types
  if (error.message.includes('Validation failed')) {
    statusCode = 400;
  } else if (error.message.includes('Email already exists')) {
    statusCode = 409;
  } else if (error.message.includes('Invalid credentials')) {
    statusCode = 401;
  } else if (error.message.includes('Token expired') || error.message.includes('Invalid token')) {
    statusCode = 401;
  } else if (error.message.includes('Unauthorized')) {
    statusCode = 401;
  } else if (error.message.includes('Rate limit exceeded')) {
    statusCode = 429;
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    error: getErrorType(statusCode),
    message,
    timestamp: new Date().toISOString()
  });
};

function getErrorType(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    default:
      return 'Error';
  }
}
import { Request, Response, NextFunction } from 'express';
import { validateUserData, validateEmail } from '../models/User';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Middleware to validate request body structure and required fields
 */
export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];

    // Check if request body exists
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Request body is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check for required fields
    for (const field of requiredFields) {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Required fields are missing or empty',
        errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to validate user registration data
 */
export const validateRegistrationData = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password, firstName, lastName, aadhaarNumber, phone } = req.body;

  const validation = validateUserData({
    email,
    password,
    firstName,
    lastName,
    aadhaarNumber,
    phone
  });

  if (!validation.valid) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid registration data',
      errors: validation.errors.map(error => ({
        field: 'general',
        message: error
      })),
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};

/**
 * Middleware to validate login credentials
 */
export const validateLoginData = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  const errors: ValidationError[] = [];

  if (!email || !validateEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Valid email is required'
    });
  }

  if (!password || password.length === 0) {
    errors.push({
      field: 'password',
      message: 'Password is required'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid login credentials',
      errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};

/**
 * Middleware to sanitize request data
 */
export const sanitizeRequestData = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    // Trim string values and remove potential XSS characters
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace
        req.body[key] = req.body[key].trim();
        
        // Basic XSS prevention - remove script tags and javascript: protocols
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '');
      }
    }
  }

  next();
};

/**
 * Middleware to validate Content-Type header for JSON requests
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Content-Type must be application/json',
        timestamp: new Date().toISOString()
      });
      return;
    }
  }

  next();
};
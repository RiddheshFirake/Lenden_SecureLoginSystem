import { Router, Request, Response, NextFunction } from 'express';
import { authService, RegisterUserData } from '../services/authService';
import { UserCredentials } from '../models/User';
import { 
  validateRequestBody, 
  validateRegistrationData, 
  validateLoginData, 
  sanitizeRequestData,
  validateContentType 
} from '../middleware/validationMiddleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Validates request body, sanitizes input, and validates registration data
 */
router.post('/register', 
  validateContentType,
  sanitizeRequestData,
  validateRequestBody(['email', 'password', 'firstName', 'lastName', 'aadhaarNumber', 'phone']),
  validateRegistrationData,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: RegisterUserData = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        aadhaarNumber: req.body.aadhaarNumber,
        phone: req.body.phone
      };

      const result = await authService.registerUser(userData);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Validates request body, sanitizes input, and validates login credentials
 */
router.post('/login',
  validateContentType,
  sanitizeRequestData,
  validateRequestBody(['email', 'password']),
  validateLoginData,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials: UserCredentials = {
        email: req.body.email,
        password: req.body.password
      };

      const authResponse = await authService.loginUser(credentials);
      
      res.status(200).json(authResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/validate
 * Validate JWT token (for testing purposes)
 */
router.post('/validate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token is required'
      });
      return;
    }

    const decoded = authService.validateToken(token);
    
    res.status(200).json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
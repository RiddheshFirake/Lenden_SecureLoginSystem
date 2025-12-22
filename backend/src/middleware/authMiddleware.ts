import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
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
    
    // Add user information to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        res.status(401).json({
          error: 'Token expired',
          message: 'Access token has expired. Please login again.'
        });
        return;
      }
      if (error.message === 'Invalid token') {
        res.status(401).json({
          error: 'Invalid token',
          message: 'Access token is invalid'
        });
        return;
      }
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token validation failed'
    });
  }
};
import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';

const router = Router();

/**
 * GET /api/profile
 * Get user profile with decrypted sensitive data
 * Requires authentication
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User information not found'
      });
      return;
    }

    const userProfile = await profileService.getUserProfile(req.user.userId);
    
    res.status(200).json({
      user: userProfile
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User profile not found') {
        res.status(404).json({
          error: 'Not Found',
          message: 'User profile not found'
        });
        return;
      }
      if (error.message === 'Profile data decryption failed') {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Unable to retrieve profile data'
        });
        return;
      }
    }
    next(error);
  }
});

/**
 * PUT /api/profile
 * Update user profile information
 * Requires authentication
 */
router.put('/', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User information not found'
      });
      return;
    }

    const { firstName, lastName, phone, aadhaarNumber } = req.body;

    // Basic validation
    if (!firstName || !lastName) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'First name and last name are required'
      });
      return;
    }

    const updatedProfile = await profileService.updateUserProfile(req.user.userId, {
      firstName,
      lastName,
      phone,
      aadhaarNumber
    });
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedProfile
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User profile not found') {
        res.status(404).json({
          error: 'Not Found',
          message: 'User profile not found'
        });
        return;
      }
      if (error.message.includes('validation')) {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
        return;
      }
    }
    next(error);
  }
});

/**
 * POST /api/profile/verify-password
 * Verify user password for sensitive operations
 * Requires authentication
 */
router.post('/verify-password', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User information not found'
      });
      return;
    }

    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Password is required'
      });
      return;
    }

    const isValid = await authService.verifyUserPassword(req.user.userId, password);
    
    if (!isValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Incorrect password. Please try again.'
      });
      return;
    }

    res.status(200).json({
      message: 'Password verified successfully',
      verified: true
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
        return;
      }
    }
    next(error);
  }
});

export { router as profileRoutes };
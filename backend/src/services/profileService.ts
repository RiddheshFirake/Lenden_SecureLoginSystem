import { userRepository } from '../repositories/UserRepository';
import { UserProfile } from '../models/User';

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  aadhaarNumber?: string;
}

export class ProfileService {
  /**
   * Retrieves user profile with decrypted sensitive data for authorized requests
   */
  public async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      this.logSecureOperation('profile_retrieval_attempt', { userId });
      
      const userProfile = await userRepository.getUserProfile(userId);
      
      if (!userProfile) {
        this.logSecureOperation('profile_not_found', { userId });
        throw new Error('User profile not found');
      }

      this.logSecureOperation('profile_retrieval_success', { userId });
      return userProfile;
    } catch (error) {
      this.logSecureError('profile_retrieval_failed', error, { userId });
      
      if (error instanceof Error) {
        if (error.message === 'User profile not found') {
          throw error;
        }
        if (error.message.includes('Failed to decrypt')) {
          throw new Error('Profile data decryption failed');
        }
      }
      
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Updates user profile information
   */
  public async updateUserProfile(userId: string, updateData: ProfileUpdateData): Promise<UserProfile> {
    try {
      this.logSecureOperation('profile_update_attempt', { userId });
      
      // Validate update data
      if (updateData.firstName !== undefined && updateData.firstName.trim().length === 0) {
        throw new Error('First name cannot be empty');
      }
      
      if (updateData.lastName !== undefined && updateData.lastName.trim().length === 0) {
        throw new Error('Last name cannot be empty');
      }
      
      if (updateData.phone !== undefined && updateData.phone.trim().length > 0) {
        const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,20}$/;
        if (!phoneRegex.test(updateData.phone)) {
          throw new Error('Invalid phone number format');
        }
      }
      
      if (updateData.aadhaarNumber !== undefined && updateData.aadhaarNumber.trim().length > 0) {
        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarRegex.test(updateData.aadhaarNumber.replace(/\s/g, ''))) {
          throw new Error('Aadhaar number must be exactly 12 digits');
        }
      }

      // Update the profile using the repository
      const updatedProfile = await userRepository.updateUserProfile(userId, updateData);
      
      if (!updatedProfile) {
        throw new Error('User profile not found');
      }
      
      this.logSecureOperation('profile_update_success', { userId });
      return updatedProfile;
    } catch (error) {
      this.logSecureError('profile_update_failed', error, { userId });
      throw error;
    }
  }

  /**
   * Logs secure operations without exposing sensitive data
   */
  private logSecureOperation(operation: string, metadata: { userId: string }): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation,
      userId: metadata.userId,
      level: 'info'
    };
    
    // In production, this would go to a secure logging service
    console.log(`[SECURE_LOG] ${JSON.stringify(logEntry)}`);
  }

  /**
   * Logs errors securely without exposing sensitive data or encryption keys
   */
  private logSecureError(operation: string, error: unknown, metadata: { userId: string }): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Sanitize error message to avoid exposing sensitive information
    const sanitizedMessage = this.sanitizeErrorMessage(errorMessage);
    
    const logEntry = {
      timestamp,
      operation,
      userId: metadata.userId,
      error: sanitizedMessage,
      level: 'error'
    };
    
    // In production, this would go to a secure logging service
    console.error(`[SECURE_ERROR_LOG] ${JSON.stringify(logEntry)}`);
  }

  /**
   * Sanitizes error messages to prevent exposure of sensitive data
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential sensitive patterns
    let sanitized = message;
    
    // Remove encryption keys or key-like patterns
    sanitized = sanitized.replace(/[0-9a-fA-F]{32,}/g, '[REDACTED_KEY]');
    
    // Remove potential Aadhaar numbers
    sanitized = sanitized.replace(/\b\d{12}\b/g, '[REDACTED_ID]');
    
    // Remove potential email addresses
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    
    return sanitized;
  }
}

// Export singleton instance
export const profileService = new ProfileService();
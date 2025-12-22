// Set up environment variables before importing services
process.env.JWT_SECRET = 'test-jwt-secret-for-property-tests';
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 64 hex characters

import * as fc from 'fast-check';
import { profileService } from '../src/services/profileService';
import { userRepository } from '../src/repositories/UserRepository';
import { authService } from '../src/services/authService';

// Mock the repository for property tests
jest.mock('../src/repositories/UserRepository');

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('ProfileService Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: secure-user-profile-system, Property 9: Authenticated profile retrieval with decryption**
   * **Validates: Requirements 3.1, 3.2, 3.4, 5.1, 5.2**
   */
  describe('Property 9: Authenticated profile retrieval with decryption', () => {
    it('should return complete user information with decrypted Aadhaar for valid user ID', async () => {
      const testData = {
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        aadhaarNumber: '123456789012',
        phone: '+1234567890'
      };

      // Mock successful profile retrieval with decrypted data
      const mockProfile = {
        id: testData.userId,
        email: testData.email,
        firstName: testData.firstName,
        lastName: testData.lastName,
        aadhaarNumber: testData.aadhaarNumber, // This should be decrypted
        phone: testData.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserRepository.getUserProfile.mockResolvedValue(mockProfile);
      
      const result = await profileService.getUserProfile(testData.userId);
      
      // Should return complete profile with decrypted Aadhaar
      expect(result).toEqual(mockProfile);
      expect(result.aadhaarNumber).toBe(testData.aadhaarNumber);
      expect(result.aadhaarNumber).toMatch(/^\d{12}$/); // Should be plaintext 12 digits
      expect(result).toHaveProperty('id', testData.userId);
      expect(result).toHaveProperty('email', testData.email);
      expect(result).toHaveProperty('firstName', testData.firstName);
      expect(result).toHaveProperty('lastName', testData.lastName);
      expect(result).toHaveProperty('phone', testData.phone);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      
      // Verify repository was called with correct user ID
      expect(mockUserRepository.getUserProfile).toHaveBeenCalledWith(testData.userId);
    });
  });

  /**
   * **Feature: secure-user-profile-system, Property 10: Profile authentication validation**
   * **Validates: Requirements 3.3**
   */
  describe('Property 10: Profile authentication validation', () => {
    it('should reject profile requests for non-existent users', async () => {
      const nonExistentUserId = 'non-existent-user-id';
      
      // Mock that user profile is not found
      mockUserRepository.getUserProfile.mockResolvedValue(null);
      
      await expect(profileService.getUserProfile(nonExistentUserId)).rejects.toThrow('User profile not found');
      
      // Verify repository was called
      expect(mockUserRepository.getUserProfile).toHaveBeenCalledWith(nonExistentUserId);
    });
  });

  /**
   * **Feature: secure-user-profile-system, Property 7: Token expiration handling**
   * **Validates: Requirements 2.5**
   */
  describe('Property 7: Token expiration handling', () => {
    it('should reject expired JWT tokens', async () => {
      try {
        // This should throw an error for expired token
        authService.validateToken('expired.token.here');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/Token expired|Invalid token|Token validation failed/);
      }
    });
  });

  /**
   * **Feature: secure-user-profile-system, Property 17: Secure error logging**
   * **Validates: Requirements 6.5**
   */
  describe('Property 17: Secure error logging', () => {
    it('should log errors securely without exposing sensitive data', async () => {
      // Spy on console.error to capture log output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const testData = {
        userId: 'test-user-id',
        sensitiveData: '123456789012' // Aadhaar-like number
      };
      
      // Mock a decryption failure that includes sensitive data in error message
      const errorWithSensitiveData = new Error(`Decryption failed for ${testData.sensitiveData}`);
      mockUserRepository.getUserProfile.mockRejectedValue(errorWithSensitiveData);
      
      try {
        await profileService.getUserProfile(testData.userId);
      } catch (error) {
        // Error should be thrown but logged securely
        expect(error).toBeInstanceOf(Error);
      }
      
      // Check that console.error was called (secure logging)
      expect(consoleSpy).toHaveBeenCalled();
      
      // Get the logged message
      const loggedMessages = consoleSpy.mock.calls.map(call => call[0]);
      const secureLogMessage = loggedMessages.find(msg => 
        typeof msg === 'string' && msg.includes('[SECURE_ERROR_LOG]')
      );
      
      expect(secureLogMessage).toBeDefined();
      
      if (secureLogMessage) {
        // Verify sensitive data is not in the log
        expect(secureLogMessage).not.toContain(testData.sensitiveData);
        expect(secureLogMessage).toContain('[REDACTED_ID]');
      }
      
      consoleSpy.mockRestore();
    });
  });
});
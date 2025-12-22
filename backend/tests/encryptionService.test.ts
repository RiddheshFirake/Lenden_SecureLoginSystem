import * as fc from 'fast-check';
import { EncryptionService } from '../src/services/encryptionService';

describe('EncryptionService Property-Based Tests', () => {
  let encryptionService: EncryptionService;

  beforeAll(() => {
    // Set up encryption key for testing
    process.env.ENCRYPTION_KEY = EncryptionService.generateEncryptionKey();
  });

  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  /**
   * Feature: secure-user-profile-system, Property 1: Registration with encryption
   * Validates: Requirements 1.1, 1.2, 6.1
   * 
   * For any valid user registration data containing an Aadhaar number, 
   * the system should create a user account and store the Aadhaar number 
   * in AES-256 encrypted format in the database
   */
  describe('Property 1: Encryption round-trip', () => {
    it('should successfully encrypt and decrypt any valid string data', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (plaintext) => {
            // Encrypt the data
            const encrypted = encryptionService.encryptSensitiveData(plaintext);
            
            // Verify encryption result structure
            expect(encrypted).toHaveProperty('encryptedData');
            expect(encrypted).toHaveProperty('iv');
            expect(encrypted).toHaveProperty('authTag');
            expect(typeof encrypted.encryptedData).toBe('string');
            expect(typeof encrypted.iv).toBe('string');
            expect(typeof encrypted.authTag).toBe('string');
            
            // Verify data is actually encrypted (not plaintext)
            expect(encrypted.encryptedData).not.toBe(plaintext);
            
            // Decrypt the data
            const decrypted = encryptionService.decryptSensitiveData(encrypted);
            
            // Verify round-trip: decrypted data matches original
            expect(decrypted).toBe(plaintext);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Aadhaar number format specifically', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100000000000, max: 999999999999 }),
          (aadhaarNumber) => {
            const aadhaarString = aadhaarNumber.toString();
            
            // Encrypt the Aadhaar number
            const encrypted = encryptionService.encryptSensitiveData(aadhaarString);
            
            // Verify it's encrypted
            expect(encrypted.encryptedData).not.toBe(aadhaarString);
            
            // Decrypt and verify
            const decrypted = encryptionService.decryptSensitiveData(encrypted);
            expect(decrypted).toBe(aadhaarString);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: secure-user-profile-system, Property 16: Encryption persistence
   * Validates: Requirements 6.4
   * 
   * For any database operation, encrypted data should remain encrypted in storage
   */
  describe('Property 16: Encryption persistence', () => {
    it('should ensure encrypted data remains encrypted and different from plaintext', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (plaintext) => {
            // Encrypt the data
            const encrypted = encryptionService.encryptSensitiveData(plaintext);
            
            // Verify that encrypted data is different from plaintext
            expect(encrypted.encryptedData).not.toBe(plaintext);
            
            // Verify that encrypted data is significantly different (not just coincidental character overlap)
            // For very short strings, we can't guarantee no character overlap in hex encoding
            if (plaintext.length > 3) {
              expect(encrypted.encryptedData.toLowerCase()).not.toContain(plaintext.toLowerCase());
            }
            
            // Verify that IV and authTag are also different from plaintext
            expect(encrypted.iv).not.toBe(plaintext);
            expect(encrypted.authTag).not.toBe(plaintext);
            
            // Verify that encrypted components are hex-encoded strings
            expect(/^[0-9a-fA-F]*$/.test(encrypted.encryptedData)).toBe(true);
            expect(/^[0-9a-fA-F]*$/.test(encrypted.iv)).toBe(true);
            expect(/^[0-9a-fA-F]*$/.test(encrypted.authTag)).toBe(true);
            
            // Verify that multiple encryptions of the same data produce different results
            const encrypted2 = encryptionService.encryptSensitiveData(plaintext);
            expect(encrypted.encryptedData).not.toBe(encrypted2.encryptedData);
            expect(encrypted.iv).not.toBe(encrypted2.iv);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain encryption integrity for Aadhaar numbers in storage format', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100000000000, max: 999999999999 }),
          (aadhaarNumber) => {
            const aadhaarString = aadhaarNumber.toString();
            
            // Simulate database storage - encrypt the data
            const storedData = encryptionService.encryptSensitiveData(aadhaarString);
            
            // Verify that what would be stored in database is encrypted
            expect(storedData.encryptedData).not.toBe(aadhaarString);
            expect(storedData.encryptedData).not.toContain(aadhaarString);
            
            // Simulate retrieving from database - data should still be encrypted
            const retrievedData = {
              encryptedData: storedData.encryptedData,
              iv: storedData.iv,
              authTag: storedData.authTag
            };
            
            // Verify retrieved data is still encrypted
            expect(retrievedData.encryptedData).not.toBe(aadhaarString);
            expect(retrievedData.encryptedData).toBe(storedData.encryptedData);
            
            // Only when explicitly decrypted should we get plaintext
            const decrypted = encryptionService.decryptSensitiveData(retrievedData);
            expect(decrypted).toBe(aadhaarString);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: secure-user-profile-system, Property 15: Authorized decryption only
   * Validates: Requirements 6.3
   * 
   * For any data retrieval operation, sensitive fields should only be decrypted 
   * when the request is properly authorized
   */
  describe('Property 15: Authorized decryption only', () => {
    it('should only decrypt data with valid encryption components', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (plaintext) => {
            // Encrypt the data (simulating authorized encryption)
            const encrypted = encryptionService.encryptSensitiveData(plaintext);
            
            // Valid decryption should work (authorized access)
            const decrypted = encryptionService.decryptSensitiveData(encrypted);
            expect(decrypted).toBe(plaintext);
            
            // Invalid decryption attempts should fail (unauthorized access)
            
            // Test with completely invalid encrypted data
            const invalidData = {
              encryptedData: 'invalid_hex_data',
              iv: encrypted.iv,
              authTag: encrypted.authTag
            };
            expect(() => encryptionService.decryptSensitiveData(invalidData)).toThrow();
            
            // Test with completely invalid IV
            const invalidIV = {
              ...encrypted,
              iv: 'invalid_hex'
            };
            expect(() => encryptionService.decryptSensitiveData(invalidIV)).toThrow();
            
            // Test with completely invalid auth tag
            const invalidAuthTag = {
              ...encrypted,
              authTag: 'invalid_hex'
            };
            expect(() => encryptionService.decryptSensitiveData(invalidAuthTag)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail decryption with incomplete encryption components', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            const encrypted = encryptionService.encryptSensitiveData(plaintext);
            
            // Test with missing encrypted data
            expect(() => encryptionService.decryptSensitiveData({
              encryptedData: '',
              iv: encrypted.iv,
              authTag: encrypted.authTag
            })).toThrow();
            
            // Test with missing IV
            expect(() => encryptionService.decryptSensitiveData({
              encryptedData: encrypted.encryptedData,
              iv: '',
              authTag: encrypted.authTag
            })).toThrow();
            
            // Test with missing auth tag
            expect(() => encryptionService.decryptSensitiveData({
              encryptedData: encrypted.encryptedData,
              iv: encrypted.iv,
              authTag: ''
            })).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should require proper encryption key for decryption', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            // Encrypt with current key
            const encrypted = encryptionService.encryptSensitiveData(plaintext);
            
            // Save current key
            const originalKey = process.env.ENCRYPTION_KEY;
            
            try {
              // Change the encryption key (simulating unauthorized access with wrong key)
              process.env.ENCRYPTION_KEY = EncryptionService.generateEncryptionKey();
              const unauthorizedService = new EncryptionService();
              
              // Decryption should fail with wrong key
              expect(() => unauthorizedService.decryptSensitiveData(encrypted)).toThrow();
            } finally {
              // Restore original key
              process.env.ENCRYPTION_KEY = originalKey;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
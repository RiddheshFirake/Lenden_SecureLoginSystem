import request from 'supertest';
import { database } from '../src/config/database';
import { userRepository } from '../src/repositories/UserRepository';
import { encryptionService } from '../src/services/encryptionService';

// Set up environment variables before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests-32-chars';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_secure_profile_db';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';

// Import app after setting environment variables
import app from '../src/index';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

/**
 * **Feature: secure-user-profile-system, E2E Integration Tests**
 * **Validates: Requirements 1.1, 2.1, 3.1, 6.1**
 * 
 * End-to-End Integration Tests
 * Tests complete user registration to profile viewing flow
 * Tests authentication error handling across frontend and backend
 * Tests encryption/decryption integration between services
 * Validates security boundaries and token handling
 */
describe('End-to-End Integration Tests', () => {
  let testUserIds: string[] = [];
  let authTokens: string[] = [];
  let isDatabaseAvailable = false;
  
  const testUsers = [
    {
      email: 'e2e.test1@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
      aadhaarNumber: '123456789012',
      phone: '+1234567890'
    },
    {
      email: 'e2e.test2@example.com',
      password: 'AnotherSecure456!',
      firstName: 'Jane',
      lastName: 'Smith',
      aadhaarNumber: '987654321098',
      phone: '+0987654321'
    }
  ];

  beforeAll(async () => {
    // Check if database is available
    try {
      await database.connect();
      await database.query('SELECT 1');
      isDatabaseAvailable = true;
      console.log('Database available for E2E tests');
    } catch (error) {
      isDatabaseAvailable = false;
      console.warn('Database not available for E2E tests - some tests will be skipped');
    }
  });

  afterAll(async () => {
    // Clean up test users if database is available
    if (isDatabaseAvailable) {
      for (const userId of testUserIds) {
        try {
          await userRepository.deleteUser(userId);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      await database.disconnect();
    }
  });

  beforeEach(() => {
    // Reset arrays for each test
    testUserIds = [];
    authTokens = [];
  });

  describe('Complete User Registration to Profile Viewing Flow', () => {
    it('should complete full user journey: register -> login -> view profile', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping database-dependent test - database not available');
        return;
      }

      const testUser = testUsers[0];

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.message).toContain('registered successfully');
      
      // Verify sensitive data is not exposed in response
      expect(registerResponse.body.user?.aadhaarNumber).toBeUndefined();
      expect(registerResponse.body.user?.password).toBeUndefined();

      // Step 2: Login with registered credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user.email).toBe(testUser.email);
      expect(loginResponse.body.user.firstName).toBe(testUser.firstName);
      
      // Store for cleanup
      testUserIds.push(loginResponse.body.user.id);
      authTokens.push(loginResponse.body.token);

      // Step 3: Access profile with JWT token
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(profileResponse.body.user.email).toBe(testUser.email);
      expect(profileResponse.body.user.firstName).toBe(testUser.firstName);
      expect(profileResponse.body.user.lastName).toBe(testUser.lastName);
      expect(profileResponse.body.user.phone).toBe(testUser.phone);
      
      // Verify Aadhaar number is decrypted in profile response
      expect(profileResponse.body.user.aadhaarNumber).toBe(testUser.aadhaarNumber);
      
      // Verify password is not exposed
      expect(profileResponse.body.user.password).toBeUndefined();
    });

    it('should handle multiple users independently', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping database-dependent test - database not available');
        return;
      }

      const user1 = testUsers[0];
      const user2 = testUsers[1];

      // Register both users
      const register1 = await request(app)
        .post('/api/auth/register')
        .send(user1)
        .expect(201);

      const register2 = await request(app)
        .post('/api/auth/register')
        .send(user2)
        .expect(201);

      // Login both users
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({ email: user1.email, password: user1.password })
        .expect(200);

      const login2 = await request(app)
        .post('/api/auth/login')
        .send({ email: user2.email, password: user2.password })
        .expect(200);

      testUserIds.push(login1.body.user.id, login2.body.user.id);

      // Verify each user can only access their own profile
      const profile1 = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${login1.body.token}`)
        .expect(200);

      const profile2 = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${login2.body.token}`)
        .expect(200);

      expect(profile1.body.user.aadhaarNumber).toBe(user1.aadhaarNumber);
      expect(profile2.body.user.aadhaarNumber).toBe(user2.aadhaarNumber);
      expect(profile1.body.user.email).toBe(user1.email);
      expect(profile2.body.user.email).toBe(user2.email);
    });
  });

  describe('Authentication Error Handling Across Frontend and Backend', () => {
    it('should reject invalid registration data', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: 'Doe',
        aadhaarNumber: '123', // Too short
        phone: 'invalid'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should prevent duplicate registration', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping database-dependent test - database not available');
        return;
      }

      const testUser = testUsers[0];

      // First registration should succeed
      const firstRegister = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      testUserIds.push(firstRegister.body.user?.id);

      // Second registration with same email should fail
      const secondRegister = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(secondRegister.body.success).toBe(false);
      expect(secondRegister.body.message).toContain('already exists');
    });

    it('should reject invalid login credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject expired or invalid JWT tokens', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should reject requests without authorization header', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('Encryption/Decryption Integration Between Services', () => {
    it('should encrypt Aadhaar number during registration and decrypt during profile retrieval', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping database-dependent test - database not available');
        return;
      }

      const testUser = testUsers[0];

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      testUserIds.push(loginResponse.body.user.id);

      // Verify data is encrypted in database
      const userFromDb = await userRepository.findUserById(loginResponse.body.user.id);
      expect(userFromDb).toBeDefined();
      expect(userFromDb!.aadhaarNumber).not.toBe(testUser.aadhaarNumber); // Should be encrypted
      expect(userFromDb!.aadhaarNumber.length).toBeGreaterThan(testUser.aadhaarNumber.length);

      // Verify decryption works in profile endpoint
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(profileResponse.body.user.aadhaarNumber).toBe(testUser.aadhaarNumber);
    });

    it('should handle encryption service failures gracefully', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping database-dependent test - database not available');
        return;
      }

      const testUser = testUsers[0];

      // Register user normally
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      testUserIds.push(loginResponse.body.user.id);

      // Manually corrupt the encrypted data in database
      await database.query(
        'UPDATE users SET aadhaar_number = $1 WHERE id = $2',
        ['corrupted_encrypted_data', loginResponse.body.user.id]
      );

      // Profile request should handle decryption failure gracefully
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(500);

      expect(profileResponse.body.success).toBe(false);
      expect(profileResponse.body.message).toContain('Error retrieving profile');
    });

    it('should validate encryption round-trip consistency', async () => {
      // This test doesn't require database - tests encryption service directly
      const testData = 'sensitive-test-data-123456789012';
      
      // Encrypt the data
      const encrypted = encryptionService.encryptSensitiveData(testData);
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.encryptedData).not.toBe(testData);

      // Decrypt the data
      const decrypted = encryptionService.decryptSensitiveData(encrypted);
      expect(decrypted).toBe(testData);
    });
  });

  describe('Security Boundaries and Token Handling', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const testCredentials = {
        email: 'ratelimit@example.com',
        password: 'wrongpassword'
      };

      // Make multiple rapid login attempts
      const promises = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send(testCredentials)
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should not expose sensitive data in error responses', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping database-dependent test - database not available');
        return;
      }

      const testUser = testUsers[0];

      // Register user
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Try to register again (should fail)
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      // Verify no sensitive data in error response
      expect(JSON.stringify(duplicateResponse.body)).not.toContain(testUser.aadhaarNumber);
      expect(JSON.stringify(duplicateResponse.body)).not.toContain(testUser.password);
    });

    it('should validate JWT token structure and claims', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping database-dependent test - database not available');
        return;
      }

      const testUser = testUsers[0];

      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      testUserIds.push(loginResponse.body.user.id);

      // Verify token structure
      const token = loginResponse.body.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify token works for protected routes
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.user.id).toBe(loginResponse.body.user.id);
    });

    it('should handle malformed authorization headers', async () => {
      const malformedHeaders = [
        'Bearer', // Missing token
        'InvalidBearer token123', // Wrong format
        'Bearer token.with.invalid.parts.extra', // Too many parts
        'Basic dXNlcjpwYXNz' // Wrong auth type
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/api/profile')
          .set('Authorization', header)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Cross-Service Integration Validation', () => {
    it('should maintain data consistency across all services', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping database-dependent test - database not available');
        return;
      }

      const testUser = testUsers[0];

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      testUserIds.push(loginResponse.body.user.id);

      // Get profile
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      // Verify data consistency across all responses
      const userId = loginResponse.body.user.id;
      expect(profileResponse.body.user.id).toBe(userId);
      expect(profileResponse.body.user.email).toBe(testUser.email);
      expect(profileResponse.body.user.firstName).toBe(testUser.firstName);
      expect(profileResponse.body.user.lastName).toBe(testUser.lastName);
      expect(profileResponse.body.user.phone).toBe(testUser.phone);
      expect(profileResponse.body.user.aadhaarNumber).toBe(testUser.aadhaarNumber);

      // Verify database consistency
      const dbUser = await userRepository.findUserById(userId);
      expect(dbUser).toBeDefined();
      expect(dbUser!.email).toBe(testUser.email);
      expect(dbUser!.firstName).toBe(testUser.firstName);
      
      // Verify encryption/decryption consistency
      const encryptionResult = {
        encryptedData: dbUser!.aadhaarNumber,
        iv: dbUser!.aadhaarIv,
        authTag: dbUser!.aadhaarAuthTag
      };
      const decryptedAadhaar = encryptionService.decryptSensitiveData(encryptionResult);
      expect(decryptedAadhaar).toBe(testUser.aadhaarNumber);
    });

    it('should validate API response formats and security', async () => {
      // Test API response structure without database dependency
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(invalidCredentials)
        .expect(401);

      // Verify error response structure
      expect(loginResponse.body).toHaveProperty('success');
      expect(loginResponse.body).toHaveProperty('message');
      expect(loginResponse.body.success).toBe(false);
      
      // Verify no sensitive data leakage
      expect(loginResponse.body).not.toHaveProperty('password');
      expect(loginResponse.body).not.toHaveProperty('aadhaarNumber');
    });
  });

  describe('API Endpoint Validation', () => {
    it('should validate request body structure for registration', async () => {
      const malformedRequests = [
        {}, // Empty body
        { email: 'test@example.com' }, // Missing required fields
        { 
          email: 'test@example.com',
          password: 'password',
          firstName: 'John'
          // Missing lastName, aadhaarNumber, phone
        }
      ];

      for (const malformedRequest of malformedRequests) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(malformedRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      }
    });

    it('should validate request body structure for login', async () => {
      const malformedRequests = [
        {}, // Empty body
        { email: 'test@example.com' }, // Missing password
        { password: 'password' } // Missing email
      ];

      for (const malformedRequest of malformedRequests) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(malformedRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      }
    });
  });
});
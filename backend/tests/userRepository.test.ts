import { UserRepository } from '../src/repositories/UserRepository';
import { database } from '../src/config/database';
import { encryptionService } from '../src/services/encryptionService';
import { CreateUserData } from '../src/models/User';
import bcrypt from 'bcrypt';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let testUserId: string;

  beforeAll(async () => {
    // Set up test environment variables
    process.env.ENCRYPTION_KEY = 'test-key-for-unit-tests-32-chars-long';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'test_secure_profile_db';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'password';

    userRepository = new UserRepository();
    
    try {
      await database.connect();
      
      // Clean up any existing test data
      await database.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
    } catch (error) {
      console.warn('Database connection failed, tests may not run properly:', error);
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await database.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
      await database.disconnect();
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    try {
      await database.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
    } catch (error) {
      console.warn('Test cleanup failed:', error);
    }
  });

  describe('createUser', () => {
    it('should create a new user with encrypted Aadhaar data', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const aadhaarEncryption = encryptionService.encryptSensitiveData('123456789012');
      
      const userData: CreateUserData = {
        email: 'test1@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        aadhaarEncryption,
        phone: '+1234567890'
      };

      // Act
      const user = await userRepository.createUser(userData);
      testUserId = user.id;

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test1@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.phone).toBe('+1234567890');
      expect(user.aadhaarNumber).toBe(aadhaarEncryption.encryptedData);
      expect(user.aadhaarIv).toBe(aadhaarEncryption.iv);
      expect(user.aadhaarAuthTag).toBe(aadhaarEncryption.authTag);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const aadhaarEncryption = encryptionService.encryptSensitiveData('123456789012');
      
      const userData: CreateUserData = {
        email: 'test2@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        aadhaarEncryption,
        phone: '+1234567890'
      };

      // Act & Assert
      await userRepository.createUser(userData);
      
      await expect(userRepository.createUser(userData))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('findUserByEmail', () => {
    it('should find existing user by email', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const aadhaarEncryption = encryptionService.encryptSensitiveData('123456789012');
      
      const userData: CreateUserData = {
        email: 'test3@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        aadhaarEncryption,
        phone: '+1234567890'
      };

      const createdUser = await userRepository.createUser(userData);

      // Act
      const foundUser = await userRepository.findUserByEmail('test3@example.com');

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.email).toBe('test3@example.com');
      expect(foundUser!.firstName).toBe('Jane');
      expect(foundUser!.lastName).toBe('Smith');
    });

    it('should return null for non-existent email', async () => {
      // Act
      const foundUser = await userRepository.findUserByEmail('nonexistent@example.com');

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find existing user by ID', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const aadhaarEncryption = encryptionService.encryptSensitiveData('123456789012');
      
      const userData: CreateUserData = {
        email: 'test4@example.com',
        password: hashedPassword,
        firstName: 'Bob',
        lastName: 'Johnson',
        aadhaarEncryption,
        phone: '+1234567890'
      };

      const createdUser = await userRepository.createUser(userData);

      // Act
      const foundUser = await userRepository.findUserById(createdUser.id);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.email).toBe('test4@example.com');
      expect(foundUser!.firstName).toBe('Bob');
      expect(foundUser!.lastName).toBe('Johnson');
    });

    it('should return null for non-existent ID', async () => {
      // Act
      const foundUser = await userRepository.findUserById('00000000-0000-0000-0000-000000000000');

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile with decrypted Aadhaar number', async () => {
      // Arrange
      const originalAadhaar = '987654321098';
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const aadhaarEncryption = encryptionService.encryptSensitiveData(originalAadhaar);
      
      const userData: CreateUserData = {
        email: 'test5@example.com',
        password: hashedPassword,
        firstName: 'Alice',
        lastName: 'Wilson',
        aadhaarEncryption,
        phone: '+1234567890'
      };

      const createdUser = await userRepository.createUser(userData);

      // Act
      const profile = await userRepository.getUserProfile(createdUser.id);

      // Assert
      expect(profile).toBeDefined();
      expect(profile!.id).toBe(createdUser.id);
      expect(profile!.email).toBe('test5@example.com');
      expect(profile!.firstName).toBe('Alice');
      expect(profile!.lastName).toBe('Wilson');
      expect(profile!.aadhaarNumber).toBe(originalAadhaar); // Should be decrypted
      expect(profile!.phone).toBe('+1234567890');
    });

    it('should return null for non-existent user ID', async () => {
      // Act
      const profile = await userRepository.getUserProfile('00000000-0000-0000-0000-000000000000');

      // Assert
      expect(profile).toBeNull();
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const aadhaarEncryption = encryptionService.encryptSensitiveData('123456789012');
      
      const userData: CreateUserData = {
        email: 'test6@example.com',
        password: hashedPassword,
        firstName: 'Charlie',
        lastName: 'Brown',
        aadhaarEncryption,
        phone: '+1234567890'
      };

      await userRepository.createUser(userData);

      // Act
      const exists = await userRepository.emailExists('test6@example.com');

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      // Act
      const exists = await userRepository.emailExists('nonexistent@example.com');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('getUserCount', () => {
    it('should return correct user count', async () => {
      // Arrange
      const initialCount = await userRepository.getUserCount();
      
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const aadhaarEncryption = encryptionService.encryptSensitiveData('123456789012');
      
      const userData: CreateUserData = {
        email: 'test7@example.com',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Miller',
        aadhaarEncryption,
        phone: '+1234567890'
      };

      await userRepository.createUser(userData);

      // Act
      const newCount = await userRepository.getUserCount();

      // Assert
      expect(newCount).toBe(initialCount + 1);
    });
  });
});
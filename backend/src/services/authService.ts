import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/UserRepository';
import { encryptionService } from './encryptionService';
import { validateUserData, UserCredentials, CreateUserData } from '../models/User';

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  aadhaarNumber: string;
  phone: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly saltRounds = 12;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn = '24h';

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || '';
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  /**
   * Registers a new user with encrypted sensitive data
   */
  public async registerUser(userData: RegisterUserData): Promise<{ success: boolean; message: string }> {
    try {
      // Validate input data
      const validation = validateUserData(userData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if email already exists
      const emailExists = await userRepository.emailExists(userData.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);

      // Encrypt Aadhaar number
      const aadhaarEncryption = encryptionService.encryptSensitiveData(userData.aadhaarNumber);

      // Create user data for repository
      const createUserData: CreateUserData = {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        aadhaarEncryption,
        phone: userData.phone
      };

      // Create user in database
      await userRepository.createUser(createUserData);

      return {
        success: true,
        message: 'User registered successfully'
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Email already exists')) {
          throw new Error('Email already exists');
        }
        if (error.message.includes('Validation failed')) {
          throw error;
        }
      }
      throw new Error('Registration failed');
    }
  }

  /**
   * Authenticates user credentials and returns JWT token
   */
  public async loginUser(credentials: UserCredentials): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await userRepository.findUserByEmail(credentials.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      const token = jwt.sign(payload, this.jwtSecret);

      // Update last login timestamp
      await userRepository.updateLastLogin(user.id);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        throw error;
      }
      throw new Error('Authentication failed');
    }
  }

  /**
   * Validates JWT token and returns user information
   */
  public validateToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error('Token validation failed');
    }
  }

  /**
   * Extracts token from Authorization header
   */
  public extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Hashes a password (utility method for testing)
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compares password with hash (utility method for testing)
   */
  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Verifies user password for sensitive operations
   */
  public async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    try {
      // Find user by ID
      const user = await userRepository.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      return isPasswordValid;
    } catch (error) {
      throw new Error('Password verification failed');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
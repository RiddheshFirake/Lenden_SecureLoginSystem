import mongoose, { Document, Schema } from 'mongoose';
import { EncryptionResult } from '../services/encryptionService';

// MongoDB Document interface
export interface IUser extends Document {
  email: string;
  password: string; // bcrypt hashed
  firstName: string;
  lastName: string;
  aadhaarNumber: string; // encrypted
  aadhaarIv: string;
  aadhaarAuthTag: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

// User interface for application logic
export interface User {
  id: string;
  email: string;
  password: string; // bcrypt hashed
  firstName: string;
  lastName: string;
  aadhaarNumber: string; // encrypted
  aadhaarIv: string;
  aadhaarAuthTag: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string; // should be hashed before passing to repository
  firstName: string;
  lastName: string;
  aadhaarEncryption: EncryptionResult; // encrypted aadhaar data
  phone: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  aadhaarNumber: string; // decrypted for display
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  email: string;
  password: string;
}

// Mongoose Schema
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  aadhaarNumber: {
    type: String,
    required: true
  },
  aadhaarIv: {
    type: String,
    required: true
  },
  aadhaarAuthTag: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'users'
});

// Create and export the model
export const UserModel = mongoose.model<IUser>('User', userSchema);

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length === 0) {
    return false;
  }
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  // Additional check: no consecutive dots
  if (email.includes('..')) {
    return false;
  }
  // Check that there's something before @ and after @
  const parts = email.split('@');
  if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
    return false;
  }
  return emailRegex.test(email);
}

/**
 * Validates phone format
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates Aadhaar number format (12 digits)
 */
export function validateAadhaar(aadhaar: string): boolean {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
}

/**
 * Validates user registration data
 */
export function validateUserData(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  aadhaarNumber: string;
  phone: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  if (!data.aadhaarNumber || !validateAadhaar(data.aadhaarNumber)) {
    errors.push('Invalid Aadhaar number format (must be 12 digits)');
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
import { 
  validateEmail, 
  validatePhone, 
  validateAadhaar, 
  validateUserData 
} from '../src/models/User';

describe('User Model Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone formats', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+1 (234) 567-8900',
        '123-456-7890',
        '+91 98765 43210'
      ];

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        '123',
        'abc1234567',
        '++1234567890',
        '123456789012345678901', // too long
        ''
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });
  });

  describe('validateAadhaar', () => {
    it('should validate correct Aadhaar formats', () => {
      const validAadhaars = [
        '123456789012',
        '987654321098',
        '1234 5678 9012' // with spaces
      ];

      validAadhaars.forEach(aadhaar => {
        expect(validateAadhaar(aadhaar)).toBe(true);
      });
    });

    it('should reject invalid Aadhaar formats', () => {
      const invalidAadhaars = [
        '12345678901', // too short
        '1234567890123', // too long
        'abcd56789012', // contains letters
        '123-456-789-012', // invalid format
        ''
      ];

      invalidAadhaars.forEach(aadhaar => {
        expect(validateAadhaar(aadhaar)).toBe(false);
      });
    });
  });

  describe('validateUserData', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      aadhaarNumber: '123456789012',
      phone: '+1234567890'
    };

    it('should validate correct user data', () => {
      const result = validateUserData(validUserData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      const result = validateUserData(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject short password', () => {
      const invalidData = { ...validUserData, password: '123' };
      const result = validateUserData(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject empty first name', () => {
      const invalidData = { ...validUserData, firstName: '' };
      const result = validateUserData(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('First name is required');
    });

    it('should reject empty last name', () => {
      const invalidData = { ...validUserData, lastName: '   ' };
      const result = validateUserData(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Last name is required');
    });

    it('should reject invalid Aadhaar number', () => {
      const invalidData = { ...validUserData, aadhaarNumber: '12345' };
      const result = validateUserData(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid Aadhaar number format (must be 12 digits)');
    });

    it('should reject invalid phone number', () => {
      const invalidData = { ...validUserData, phone: '123' };
      const result = validateUserData(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format');
    });

    it('should collect multiple validation errors', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
        aadhaarNumber: '123',
        phone: '123'
      };
      
      const result = validateUserData(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('First name is required');
      expect(result.errors).toContain('Last name is required');
      expect(result.errors).toContain('Invalid Aadhaar number format (must be 12 digits)');
      expect(result.errors).toContain('Invalid phone number format');
    });
  });
});
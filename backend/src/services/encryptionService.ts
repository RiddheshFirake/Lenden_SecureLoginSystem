import crypto from 'crypto';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    // If key is hex-encoded, decode it; otherwise use as-is and hash to ensure proper length
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
      return Buffer.from(key, 'hex');
    }
    
    // Hash the key to ensure it's exactly 32 bytes
    return crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Encrypts sensitive data using AES-256-GCM
   * @param plaintext The data to encrypt
   * @returns Object containing encrypted data, IV, and authentication tag
   */
  public encryptSensitiveData(plaintext: string): EncryptionResult {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Invalid input: plaintext must be a non-empty string');
      }

      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(Buffer.from('additional-auth-data'));

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypts sensitive data for authorized access
   * @param encryptionResult Object containing encrypted data, IV, and auth tag
   * @returns Decrypted plaintext data
   */
  public decryptSensitiveData(encryptionResult: EncryptionResult): string {
    try {
      if (!encryptionResult || !encryptionResult.encryptedData || !encryptionResult.iv || !encryptionResult.authTag) {
        throw new Error('Invalid input: missing required encryption components');
      }

      const key = this.getEncryptionKey();
      const iv = Buffer.from(encryptionResult.iv, 'hex');
      const authTag = Buffer.from(encryptionResult.authTag, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAAD(Buffer.from('additional-auth-data'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptionResult.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a new encryption key for initial setup
   * @returns Hex-encoded encryption key
   */
  public static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
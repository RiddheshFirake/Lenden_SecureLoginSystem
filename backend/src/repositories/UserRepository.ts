import { UserModel, IUser, User, CreateUserData, UserProfile } from '../models/User';
import { encryptionService, EncryptionResult } from '../services/encryptionService';

export class UserRepository {
  /**
   * Creates a new user in the database
   */
  public async createUser(userData: CreateUserData): Promise<User> {
    try {
      const newUser = new UserModel({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        aadhaarNumber: userData.aadhaarEncryption.encryptedData,
        aadhaarIv: userData.aadhaarEncryption.iv,
        aadhaarAuthTag: userData.aadhaarEncryption.authTag,
        phone: userData.phone
      });

      const savedUser = await newUser.save();
      return this.mapDocumentToUser(savedUser);
    } catch (error: any) {
      if (error.code === 11000) { // MongoDB duplicate key error
        throw new Error('Email already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Finds a user by email for authentication
   */
  public async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ email: email.toLowerCase() }).exec();
      
      if (!user) {
        return null;
      }

      return this.mapDocumentToUser(user);
    } catch (error: any) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Finds a user by ID
   */
  public async findUserById(id: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(id).exec();
      
      if (!user) {
        return null;
      }

      return this.mapDocumentToUser(user);
    } catch (error: any) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Gets user profile with decrypted sensitive data
   */
  public async getUserProfile(id: string): Promise<UserProfile | null> {
    const user = await this.findUserById(id);
    
    if (!user) {
      return null;
    }

    try {
      // Decrypt the Aadhaar number
      const encryptionResult: EncryptionResult = {
        encryptedData: user.aadhaarNumber,
        iv: user.aadhaarIv,
        authTag: user.aadhaarAuthTag
      };

      const decryptedAadhaar = encryptionService.decryptSensitiveData(encryptionResult);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        aadhaarNumber: decryptedAadhaar,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error: any) {
      throw new Error(`Failed to decrypt user profile: ${error.message}`);
    }
  }

  /**
   * Checks if an email already exists in the database
   */
  public async emailExists(email: string): Promise<boolean> {
    try {
      const user = await UserModel.findOne({ email: email.toLowerCase() }).select('_id').exec();
      return user !== null;
    } catch (error: any) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }
  }

  /**
   * Updates user profile information
   */
  public async updateUserProfile(id: string, updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    aadhaarNumber?: string;
  }): Promise<UserProfile | null> {
    try {
      const updateFields: any = {};
      
      if (updateData.firstName !== undefined) {
        updateFields.firstName = updateData.firstName;
      }
      
      if (updateData.lastName !== undefined) {
        updateFields.lastName = updateData.lastName;
      }
      
      if (updateData.phone !== undefined) {
        updateFields.phone = updateData.phone;
      }
      
      if (updateData.aadhaarNumber !== undefined) {
        // Encrypt the new Aadhaar number
        const encryptionResult = encryptionService.encryptSensitiveData(updateData.aadhaarNumber);
        updateFields.aadhaarNumber = encryptionResult.encryptedData;
        updateFields.aadhaarIv = encryptionResult.iv;
        updateFields.aadhaarAuthTag = encryptionResult.authTag;
      }
      
      updateFields.updatedAt = new Date();
      
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true }
      ).exec();
      
      if (!updatedUser) {
        return null;
      }
      
      // Return the updated profile with decrypted data
      return await this.getUserProfile(id);
    } catch (error: any) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  /**
   * Updates user's last login timestamp (for future use)
   */
  public async updateLastLogin(id: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(id, { updatedAt: new Date() }).exec();
    } catch (error: any) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Maps MongoDB document to User object
   */
  private mapDocumentToUser(doc: IUser): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      firstName: doc.firstName,
      lastName: doc.lastName,
      aadhaarNumber: doc.aadhaarNumber,
      aadhaarIv: doc.aadhaarIv,
      aadhaarAuthTag: doc.aadhaarAuthTag,
      phone: doc.phone,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Gets total user count (for admin purposes)
   */
  public async getUserCount(): Promise<number> {
    try {
      return await UserModel.countDocuments().exec();
    } catch (error: any) {
      throw new Error(`Failed to get user count: ${error.message}`);
    }
  }

  /**
   * Deletes a user by ID (for testing purposes)
   */
  public async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error: any) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Deletes a user by email (for testing purposes)
   */
  public async deleteUserByEmail(email: string): Promise<boolean> {
    try {
      const result = await UserModel.findOneAndDelete({ email: email.toLowerCase() }).exec();
      return result !== null;
    } catch (error: any) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
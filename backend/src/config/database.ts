import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

class DatabaseConnection {
  private isConnected: boolean = false;

  private getConfig(): DatabaseConfig {
    // Temporarily hardcode the working URI
    const mongoUri = 'mongodb+srv://acc94926_db_user:kl5FUnQfYqISjjFq@cluster0.vjh8uv9.mongodb.net/secure_profile_db?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('Using MongoDB URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
    
    return {
      uri: mongoUri,
      options: {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      }
    };
  }

  public async connect(): Promise<typeof mongoose> {
    if (this.isConnected) {
      return mongoose;
    }

    try {
      const config = this.getConfig();
      await mongoose.connect(config.uri, config.options);
      
      this.isConnected = true;
      console.log('MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

      return mongoose;
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    }
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection(): typeof mongoose {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return mongoose;
  }
}

// Export singleton instance
export const database = new DatabaseConnection();
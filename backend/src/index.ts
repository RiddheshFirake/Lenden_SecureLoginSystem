import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { database } from './config/database';
import { authRoutes } from './routes/authRoutes';
import { profileRoutes } from './routes/profileRoutes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { securityLoggingMiddleware } from './middleware/loggingMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database connection
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    console.log('Database connected successfully');

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(securityLoggingMiddleware);
    app.use(rateLimitMiddleware);

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);

    // Error handling middleware
    app.use(errorHandler);

    // Health check endpoint
    app.get('/health', (_, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: database.isConnectedToDatabase() ? 'connected' : 'disconnected'
      });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;
import { database } from '../config/database';
import { UserModel } from '../models/User';

async function initDatabase() {
  try {
    console.log('Initializing MongoDB database...');
    
    // Connect to MongoDB
    await database.connect();
    
    // Create indexes for better performance
    await UserModel.createIndexes();
    
    console.log('Database initialization completed successfully');
    console.log('Available collections:');
    
    // List collections
    const mongoose = database.getConnection();
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Test user count
    const userCount = await UserModel.countDocuments();
    console.log(`Current user count: ${userCount}`);
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initDatabase();
}

export { initDatabase };
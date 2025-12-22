import { database } from '../config/database';
import { userRepository } from '../repositories/UserRepository';

async function cleanupTestUsers() {
  try {
    console.log('Connecting to database...');
    await database.connect();
    
    // Delete test users
    const testEmails = [
      'test@example.com',
      'demo@example.com',
      'user@test.com'
    ];
    
    for (const email of testEmails) {
      const deleted = await userRepository.deleteUserByEmail(email);
      if (deleted) {
        console.log(`✅ Deleted user: ${email}`);
      } else {
        console.log(`ℹ️  User not found: ${email}`);
      }
    }
    
    const userCount = await userRepository.getUserCount();
    console.log(`📊 Total users remaining: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestUsers();
}

export { cleanupTestUsers };
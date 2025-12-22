# MongoDB Database Setup

This document provides instructions for setting up MongoDB for the Secure User Profile System.

## Prerequisites

- MongoDB 6.0 or higher
- Node.js 18+ with npm/yarn

## Installation Options

### Option 1: Local MongoDB Installation

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a Windows service and start automatically

#### macOS (using Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Ubuntu/Debian
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Set up database access (create a user)
4. Set up network access (whitelist your IP)
5. Get your connection string

### Option 3: Docker

```bash
# Run MongoDB in a Docker container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:6.0

# For development without authentication
docker run -d \
  --name mongodb-dev \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6.0
```

## Environment Configuration

Create a `.env` file in the backend directory based on `.env.example`:

### For Local MongoDB (no authentication)
```env
MONGODB_URI=mongodb://localhost:27017/secure_profile_db
```

### For Local MongoDB (with authentication)
```env
MONGODB_URI=mongodb://username:password@localhost:27017/secure_profile_db
```

### For MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secure_profile_db?retryWrites=true&w=majority
```

### Alternative Configuration (individual parameters)
```env
DB_HOST=localhost
DB_PORT=27017
DB_NAME=secure_profile_db
```

## Database Initialization

1. Install dependencies:
```bash
cd backend
npm install
```

2. Initialize the database:
```bash
npm run db:init
```

This will:
- Connect to MongoDB
- Create necessary indexes
- Display database information

## Database Schema

The application uses the following MongoDB collection:

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  aadhaarNumber: String (encrypted),
  aadhaarIv: String,
  aadhaarAuthTag: String,
  phone: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

1. **Encryption**: Sensitive data (Aadhaar numbers) is encrypted using AES-256-GCM
2. **Password Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
3. **Indexes**: Email field is indexed for fast lookups
4. **Validation**: Mongoose schema validation ensures data integrity

## Verification

To verify your setup:

1. Check MongoDB connection:
```bash
# For local installation
mongosh
> show dbs
> use secure_profile_db
> show collections
```

2. Run the application:
```bash
npm run dev
```

3. Check health endpoint:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

## Troubleshooting

### Connection Issues
- Ensure MongoDB service is running
- Check firewall settings
- Verify connection string format
- For Atlas: check network access whitelist

### Authentication Issues
- Verify username/password in connection string
- Check database user permissions
- Ensure authentication database is correct

### Performance
- MongoDB automatically creates indexes defined in schemas
- Monitor slow queries using MongoDB Compass or logs
- Consider adding compound indexes for complex queries

## Development vs Production

### Development
- Use local MongoDB without authentication for simplicity
- Enable MongoDB logging for debugging
- Use MongoDB Compass for visual database management

### Production
- Use MongoDB Atlas or properly secured self-hosted instance
- Enable authentication and authorization
- Use connection pooling
- Set up monitoring and backups
- Use environment-specific connection strings

## Backup and Recovery

### Local MongoDB
```bash
# Backup
mongodump --db secure_profile_db --out /path/to/backup

# Restore
mongorestore --db secure_profile_db /path/to/backup/secure_profile_db
```

### MongoDB Atlas
- Automatic backups are available in Atlas
- Use Atlas UI for point-in-time recovery
- Export data using mongodump with Atlas connection string
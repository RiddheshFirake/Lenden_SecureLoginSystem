# Secure User Profile System with MongoDB

A full-stack application with secure user authentication and encrypted profile management using MongoDB Atlas.

## 🚀 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Data Encryption**: Sensitive data (Aadhaar numbers) encrypted using AES-256-GCM
- **MongoDB Atlas**: Cloud-hosted MongoDB database
- **React Frontend**: Modern UI with Material-UI components
- **Express Backend**: RESTful API with comprehensive security middleware
- **TypeScript**: Full type safety across the stack

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (already configured)

## 🛠️ Installation

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## 🔧 Configuration

### Backend Environment Variables

The backend is already configured with MongoDB Atlas. The `.env` file contains:

```env
MONGODB_URI=mongodb+srv://...
ENCRYPTION_KEY=abcdefghijklmnopqrstuvwxyz123456
NODE_ENV=development
PORT=3001
JWT_SECRET=test-jwt-secret-key-for-development
JWT_EXPIRES_IN=24h
```

### Frontend Environment Variables

The frontend `.env` file is configured to connect to the backend:

```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=10000
```

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

## 📱 Using the Application

1. **Register**: Navigate to `/register` to create a new account
   - Provide email, password, first name, last name, Aadhaar number (12 digits), and phone
   - All data is validated on both client and server
   - Sensitive data is encrypted before storage

2. **Login**: Navigate to `/login` to access your account
   - Use your registered email and password
   - Receive a JWT token for authenticated requests

3. **Dashboard**: After login, view your profile
   - See your decrypted profile information
   - Logout option available

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **Data Encryption**: AES-256-GCM for sensitive data
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation on client and server
- **Error Handling**: Graceful error handling with user-friendly messages
- **CORS Protection**: Configured CORS policies

## 📊 Database Schema

### Users Collection (MongoDB)

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

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### Profile (Protected)

- `GET /api/profile` - Get user profile (requires authentication)

### Health Check

- `GET /health` - Check server and database status

## 🏗️ Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── index.ts         # Server entry point
│   ├── tests/               # Backend tests
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.tsx          # Main app component
│   └── package.json
│
└── README.md
```

## 🔄 Migration from PostgreSQL to MongoDB

This project has been successfully migrated from PostgreSQL to MongoDB Atlas:

- ✅ Replaced `pg` with `mongoose`
- ✅ Updated database configuration
- ✅ Converted SQL queries to MongoDB operations
- ✅ Updated all models and repositories
- ✅ Maintained all security features
- ✅ All tests updated for MongoDB

## 🐛 Troubleshooting

### Backend won't start
- Ensure MongoDB Atlas connection string is correct
- Check that all environment variables are set
- Verify Node.js version is 18+

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check CORS configuration
- Verify API base URL in frontend .env

### Database connection issues
- Verify MongoDB Atlas cluster is running
- Check network access whitelist in Atlas
- Ensure database user credentials are correct

## 📝 License

ISC

## 👥 Support

For issues or questions, please check the troubleshooting section or review the code documentation.
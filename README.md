# 🔐 Secure User Profile & Access Control System

**Identity Management Microservice (Option A)**

A full-stack Identity Management Microservice implementing **Stateless Authentication** using JWT tokens and **Field-level Encryption** (AES-256) for sensitive data. This system provides secure user registration, authentication, and profile management with enterprise-grade security features.

## 🎯 Project Overview

This project implements a comprehensive **Identity Management Microservice** with the following core features:

- **🔑 Stateless Authentication**: JWT-based authentication system eliminating server-side session storage
- **🛡️ Field-level Encryption**: AES-256-GCM encryption specifically for Aadhaar/ID numbers stored in the database
- **📊 Secure Dashboard**: Frontend interface that fetches and securely decrypts sensitive user data
- **🔒 Enterprise Security**: Comprehensive security middleware including rate limiting, input validation, and CORS protection
- **📱 Modern UI**: Responsive React.js frontend with Material-UI components
- **⚡ Scalable Backend**: Node.js with Express.js providing RESTful API endpoints

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js 19.x with TypeScript
- **UI Library**: Material-UI (@mui/material)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Build Tool**: Create React App (react-scripts)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x with TypeScript
- **Authentication**: JSON Web Tokens (jsonwebtoken)
- **Encryption**: AES-256-GCM (Node.js crypto module)
- **Password Hashing**: bcrypt (12 salt rounds)

### Database
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose 8.x
- **Schema**: Document-based with encrypted field storage

## 🚀 Setup & Run Instructions

### Prerequisites
- Node.js 18+ and npm
- Git for cloning the repository

### 1. Clone the Repository

```bash
git clone https://github.com/RiddheshFirake/Lenden_SecureLoginSystem.git
cd Lenden_SecureLoginSystem
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables (create .env file)
cp .env.example .env
```

**Required Environment Variables:**
```env
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-super-secure-jwt-secret-key
ENCRYPTION_KEY=your-64-character-hex-encryption-key
NODE_ENV=development
PORT=3001
JWT_EXPIRES_IN=24h
```

```bash
# Initialize database (optional - creates indexes)
npm run db:init

# Start development server
npm run dev
```

The backend server will start on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Set up environment variables (create .env file)
cp .env.example .env
```

**Required Environment Variables:**
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=10000
```

```bash
# Start development server
npm start
```

The frontend will start on `http://localhost:3000` and open automatically in your browser.

## 📚 API Documentation

### Core Endpoints

#### Authentication Endpoints

**POST /api/auth/register**
- **Purpose**: User registration with encrypted data storage
- **Body**: `{ email, password, firstName, lastName, aadhaarNumber, phone }`
- **Response**: `{ message, user: { id, email, firstName, lastName } }`
- **Security**: Validates input, hashes password, encrypts Aadhaar number

**POST /api/auth/login**
- **Purpose**: User authentication returning JWT token
- **Body**: `{ email, password }`
- **Response**: `{ token, user: { id, email, firstName, lastName } }`
- **Security**: Validates credentials, returns stateless JWT

#### Protected Endpoints (Require JWT)

**GET /api/profile**
- **Purpose**: Retrieve user profile with decrypted sensitive data
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: `{ id, email, firstName, lastName, aadhaarNumber, phone, createdAt }`
- **Security**: Validates JWT, decrypts Aadhaar number for display

#### Health Check

**GET /health**
- **Purpose**: Server and database connectivity status
- **Response**: `{ status: "healthy", database: "connected", timestamp }`

## 🗄️ Database Schema

### Users Collection (MongoDB)

| Field | Type | Description | Security |
|-------|------|-------------|----------|
| `_id` | ObjectId | Primary key | Auto-generated |
| `email` | String | User email (unique, indexed) | Validated, lowercase |
| `password` | String | User password | bcrypt hashed (12 rounds) |
| `firstName` | String | User's first name | Validated, trimmed |
| `lastName` | String | User's last name | Validated, trimmed |
| `aadhaarNumber` | String | **Encrypted Aadhaar/ID** | **AES-256-GCM encrypted** |
| `aadhaarIv` | String | Initialization vector for encryption | Required for decryption |
| `aadhaarAuthTag` | String | Authentication tag for encryption | Ensures data integrity |
| `phone` | String | User's phone number | Validated format |
| `createdAt` | Date | Account creation timestamp | Auto-generated |
| `updatedAt` | Date | Last modification timestamp | Auto-updated |

**Example Encrypted Storage:**
```javascript
{
  "_id": ObjectId("..."),
  "email": "user@example.com",
  "password": "$2b$12$...", // bcrypt hash
  "firstName": "John",
  "lastName": "Doe",
  "aadhaarNumber": "a1b2c3d4e5f6...", // AES-256 encrypted
  "aadhaarIv": "1234567890abcdef...", // 16-byte IV
  "aadhaarAuthTag": "fedcba0987654321...", // 16-byte auth tag
  "phone": "+1234567890",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

## 🤖 AI Tool Usage Log

| Task | AI Tool Used | Description | Effectiveness Score (1-5) |
|------|--------------|-------------|---------------------------|
| JWT Authentication Middleware | GitHub Copilot | Generated comprehensive JWT validation middleware with error handling and token extraction from Authorization headers. Saved 3 hours on boilerplate code, minimal debugging required. | 5/5 |
| AES-256 Encryption Service | ChatGPT | Created encryption/decryption service using Node.js crypto module with proper IV and auth tag handling for Aadhaar numbers. Generated clean code but required manual optimization for error handling. | 5/5 |
| MongoDB Schema Design | Claude AI | Designed Mongoose schema with proper indexing, validation, and encrypted field structure for secure data storage. Saved 2 hours on boilerplate code, but debugging AI-generated schema validation took additional time. | 4/5 |
| React Authentication Context | GitHub Copilot | Generated React Context API implementation for global authentication state management with TypeScript support. Excellent code quality with proper type definitions. | 5/5 |
| Input Validation Middleware | Google Gemini | Created comprehensive validation middleware for email, password, phone, and Aadhaar number formats with security checks. Good foundation but required manual refinement for edge cases. | 4/5 |
| Material-UI Form Components | ChatGPT | Generated responsive login and registration forms with Material-UI components, error handling, and accessibility features. Saved significant development time with clean, production-ready code. | 5/5 |
| Property-Based Testing | Claude AI | Created property-based tests using fast-check library for encryption/decryption edge cases and authentication flows. Generated comprehensive test cases but required manual adjustment for specific business logic. | 4/5 |
| Rate Limiting Middleware | GitHub Copilot | Implemented express-rate-limit middleware to prevent brute force attacks on authentication endpoints. Perfect implementation with proper configuration options. | 5/5 |
| Error Boundary Components | Groq | Generated React Error Boundary components for graceful error handling and user-friendly error messages. Good structure but needed customization for specific error types and logging. | 4/5 |
| API Integration Service | ChatGPT | Created Axios-based API service with interceptors for token management, error handling, and request/response logging. Excellent foundation that significantly accelerated development. | 5/5 |

## 🔒 Security Features

- **🔐 Stateless Authentication**: JWT tokens eliminate server-side session storage
- **🛡️ Field-level Encryption**: AES-256-GCM encryption for Aadhaar numbers
- **🔑 Password Security**: bcrypt hashing with 12 salt rounds
- **🚫 Rate Limiting**: Protection against brute force attacks
- **✅ Input Validation**: Comprehensive client and server-side validation
- **🌐 CORS Protection**: Configured cross-origin resource sharing
- **📝 Security Logging**: Comprehensive audit trail for security events
- **🔍 Error Handling**: Secure error messages without data exposure

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
```

### Frontend Tests
```bash
cd frontend
npm test                # Run component tests
```

**Test Coverage:**
- Unit tests for all services and utilities
- Integration tests for API endpoints
- Property-based tests for encryption/decryption
- End-to-end user flow testing

## 🏗️ Project Architecture

```
├── backend/                    # Node.js/Express API Server
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── middleware/        # Security & validation middleware
│   │   ├── models/           # Mongoose schemas & validation
│   │   ├── repositories/     # Data access layer
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic & encryption
│   │   └── index.ts          # Application entry point
│   └── tests/                # Comprehensive test suite
│
├── frontend/                  # React.js Web Application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React Context providers
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # API communication layer
│   │   └── App.tsx          # Main application component
│   └── public/              # Static assets
│
└── README.md                 # Project documentation
```

## 🚀 Deployment Notes

- **Backend**: Can be deployed to any Node.js hosting service (Heroku, AWS, DigitalOcean)
- **Frontend**: Static build can be deployed to CDN (Netlify, Vercel, AWS S3)
- **Database**: MongoDB Atlas provides cloud hosting with built-in security
- **Environment**: Ensure all environment variables are properly configured in production

## 📝 License

ISC

---

**Assignment Submission**: Identity Management Microservice (Option A)  
**Key Features**: Stateless JWT Authentication + AES-256 Field Encryption  
**Tech Stack**: React.js + Node.js/Express + MongoDB Atlas

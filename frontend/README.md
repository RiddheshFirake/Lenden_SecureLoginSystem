# Secure User Profile System - Frontend

This is the React frontend for the Secure User Profile & Access Control System.

## Features

- React 19 with TypeScript
- Material-UI for UI components
- React Router for navigation
- Axios for HTTP client communication
- Authentication context for state management
- Protected routes for authenticated pages
- Environment-based configuration

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── ProtectedRoute.tsx
│   └── PublicRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── DashboardPage.tsx
├── services/           # API services
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── App.tsx             # Main application component
```

## Environment Variables

- `REACT_APP_API_BASE_URL`: Backend API base URL (default: http://localhost:3001/api)
- `REACT_APP_API_TIMEOUT`: API request timeout in milliseconds (default: 10000)

## Authentication Flow

1. User visits the application
2. If not authenticated, redirected to login page
3. After successful login, JWT token is stored in localStorage
4. Protected routes check authentication status
5. API requests automatically include the JWT token
6. On token expiration or invalid token, user is redirected to login

## Next Steps

The following components will be implemented in subsequent tasks:
- LoginForm component with validation
- RegisterForm component with all required fields
- ProfileDashboard with user data display
- Error handling and user experience improvements
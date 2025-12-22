// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  aadhaarNumber?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile extends User {
  aadhaarNumber: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication types
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  aadhaarNumber: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  field?: string;
  retryable?: boolean;
}
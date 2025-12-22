export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  aadhaarNumber?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
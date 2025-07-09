// Common type definitions for the application

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  department: string | null;
  school: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  duration: number;
  location: string | null;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  school: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  department: string | null;
  school: string | null;
} 
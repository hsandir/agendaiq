// Common type definitions for the application

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  department: string | null;
  school: string | null;
  isActive: boolean;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  school: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiResponse<T = Record<string, unknown>> {
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

// API request types
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
  school?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  school?: string;
}

export interface CreateSchoolRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  logo?: string;
  districtId?: string;
}

export interface CreateDistrictRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  logo?: string;
}

export interface SetupInitialRequest {
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  districtName: string;
  schoolName: string;
  [key: string]: unknown;
}

export interface AssignRoleRequest {
  email: string;
  roleId: string;
  departmentId: string;
  managerId?: string;
}

// API response types with proper structure
export interface UserWithRelations {
  id: string;
  email: string;
  name: string | null;
  staff?: {
    id: string;
    role: {
      id: string;
      title: string;
      is_leadership: boolean;
      priority: number;
    };
    department?: {
      id: string;
      name: string;
    };
    school?: {
      id: string;
      name: string;
    };
    district?: {
      id: string;
      name: string;
    };
  };
}

// Error handling types
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

// Test utility types
export interface MockUser extends UserWithRelations {
  [key: string]: unknown;
}

export interface MockSession {
  user: MockUser;
  expires: string;
}

// Audit log types
export interface AuditRecord {
  id: string;
  tableName: string;
  recordId: string;
  operation: string;
  userId?: string;
  staffId?: string;
  description?: string;
  risk_score?: number;
  category?: string;
  ip_address?: string;
  User?: {
    email: string;
    name?: string;
  };
  created_at: Date;
}

export interface SortableAuditRecord extends AuditRecord {
  [key: string]: unknown;
}

// Monitoring types
export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface MonitoringMetrics {
  [key: string]: unknown;
} 
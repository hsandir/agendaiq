import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'
// Remove unused imports

// Mock session data
export const mockSession: Session = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    is_active: true,
    staff: {
      id: '1',
      user_id: 1,
      role_id: 1,
      department_id: 1,
      school_id: 1,
      district_id: 1,
      role: {
        id: '1',
        title: 'Teacher',
        is_leadership: false,
        priority: 6,
      },
      department: {
        id: '1',
        name: 'Mathematics',
      },
      school: {
        id: '1',
        name: 'Test School',
      },
      district: {
        id: '1',
        name: 'Test District',
      },
    },
  },
} as Session

export const mockAdminSession: Session = {
  ...mockSession,
  user: {
    ...mockSession.user,
    staff: {
      ...((mockSession.user as { staff?: Record<string, unknown> })?.staff ?? {}),
      role: {
        id: '1',
        title: 'Administrator',
        is_leadership: true,
        priority: 1,
      },
    },
  },
} as Session

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: Session | null
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    session = mockSession,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// API test helpers
export const createMockRequest = (
  method: string = 'GET',
  body?: unknown,
  headers?: Record<string, string>
): Request => {
  const url = 'http://localhost:3000/api/test'
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  return new Request(url, init)
}

export const createMockNextRequest = (
  method: string = 'GET',
  body?: unknown,
  headers?: Record<string, string>
) => {
  const request = createMockRequest(method, body, headers)
  return {
    ...request,
    json: async () => body,
    text: async () => JSON.stringify(body),
    formData: async () => new FormData(),
    headers: new Headers(headers),
  } as Request & {
    json: () => Promise<unknown>;
    text: () => Promise<string>;
    formData: () => Promise<FormData>;
  }
}

// Database test helpers
export const createTestUser = (overrides?: Record<string, unknown>) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: '$2a$10$hashedpassword',
  emailVerified: true,
  is_active: true,
  google_id: null,
  preferences: {},
  created_at: new Date(),
  updated_at: new Date(),
  failed_login_attempts: 0,
  last_failed_login: null,
  account_locked_until: null,
  two_factor_enabled: false,
  two_factor_secret: null,
  ...overrides,
})

export const createTestStaff = (overrides?: Record<string, unknown>) => ({
  id: 1,
  user_id: 1,
  role_id: 1,
  department_id: 1,
  school_id: 1,
  district_id: 1,
  employee_number: 'EMP001',
  hire_date: new Date(),
  phone: '1234567890',
  office_location: 'Building A',
  is_active: true,
  is_on_leave: false,
  subjects: ['Mathematics'],
  bio: 'Test bio',
  specializations: [],
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

export const createTestMeeting = (overrides?: Record<string, unknown>) => ({
  id: 1,
  title: 'Test Meeting',
  description: 'Test meeting description',
  start_time: new Date(),
  end_time: new Date(Date.now() + 60 * 60 * 1000),
  organizer_id: 1,
  department_id: 1,
  school_id: 1,
  district_id: 1,
  status: 'SCHEDULED',
  zoom_meeting_id: null,
  zoom_join_url: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

// Wait helpers
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock fetch responses
export const mockFetchResponse = (data: unknown, status: number = 200) => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response)
}

export const mockFetchError = (error: string, status: number = 500) => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error }),
    text: async () => JSON.stringify({ error }),
  } as Response)
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'
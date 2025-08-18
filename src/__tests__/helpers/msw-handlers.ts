import { http, HttpResponse } from 'msw'

// Mock API handlers for MSW (Mock Service Worker)
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string }
    
    if (body?.email === 'admin@test.com' && body?.password === 'password123') {
      return HttpResponse.json({
        success: true,
        user: {
          id: 1,
          email: 'admin@test.com',
          name: 'Test Admin',
          role: 'Administrator',
        },
        token: 'mock-jwt-token',
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>; as { email?: string }
    
    if (body?.email === 'existing@test.com') {
      return HttpResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Registration successful',
    })
  }),

  // Meeting endpoints
  http.get('/api/meetings', () => {
    return HttpResponse.json({
      meetings: [
        {
          id: 1,
          title: 'Test Meeting',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          status: 'SCHEDULED',
          organizer: {
            id: 1,
            name: 'Test Admin',
            email: 'admin@test.com',
            role: 'Administrator',
          },
          attendees: [],
        },
      ],
    })
  }),

  http.post('/api/meetings', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>; as Record<string, unknown>;
    
    return HttpResponse.json(
      {
        meeting: {
          id: 2,
          ...(body as object),
          status: 'SCHEDULED',
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  }),

  // User endpoints
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      user: {
        id: Number(params.id),
        name: 'Test User',
        email: 'user@test.com',
        role: 'Teacher',
      },
    })
  }),

  // Test endpoints
  http.get('/api/tests/suites', () => {
    return HttpResponse.json({
      suites: [
        {
          name: 'Auth Tests',
          path: 'src/__tests__/integration/auth',
          tests: 15,
          status: 'idle',
        },
        {
          name: 'API Tests',
          path: 'src/__tests__/unit/api',
          tests: 25,
          status: 'idle',
        },
      ],
    })
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  }),
]

// Error simulation handlers
export const errorHandlers = [
  http.get('/api/meetings', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  http.post('/api/meetings', () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }),
]

// Network error simulation
export const networkErrorHandlers = [
  http.get('/api/meetings', () => {
    return HttpResponse.error()
  }),
]
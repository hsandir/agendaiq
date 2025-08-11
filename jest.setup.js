import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import 'whatwg-fetch'
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill'

// Set test environment DATABASE_URL if not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/agendaiq_test'
}
// Always ensure test database URL for integration tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/agendaiq_test'

// Mock next/dynamic
jest.mock('next/dynamic', () => require('./__mocks__/next/dynamic'))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      reload: jest.fn(),
      refresh: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
  useParams() {
    return {}
  },
  usePathname() {
    return '/'
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock next-auth server
jest.mock('next-auth', () => ({
  default: jest.fn(),
}))

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
  encode: jest.fn(),
  decode: jest.fn(),
}))

// Mock next-auth adapters
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}))

// Mock lucide-react - return mock components for all icons
jest.mock('lucide-react', () => {
  const React = require('react');
  const mockIcon = React.forwardRef((props, ref) => {
    return React.createElement('svg', { ...props, ref });
  });
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === '__esModule') {
        return true;
      }
      return mockIcon;
    }
  });
})

// Mock Pusher
jest.mock('pusher-js', () => {
  return jest.fn().mockImplementation(() => ({
    subscribe: jest.fn().mockReturnValue({
      bind: jest.fn(),
      unbind: jest.fn(),
      trigger: jest.fn(),
    }),
    unsubscribe: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      bind: jest.fn(),
      unbind: jest.fn(),
      state: 'connected',
    },
  }))
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock NextResponse for middleware tests
const mockNextResponse = {
  json: jest.fn().mockImplementation((body, init) => ({
    status: init?.status || 200,
    headers: new Headers(init?.headers),
    json: async () => body,
    body: JSON.stringify(body)
  })),
  redirect: jest.fn().mockImplementation((url, status = 302) => ({
    status,
    headers: new Headers({ Location: url }),
    url
  })),
  rewrite: jest.fn().mockImplementation((url) => ({
    status: 200,
    headers: new Headers(),
    url
  })),
  next: jest.fn().mockImplementation(() => ({
    status: 200,
    headers: new Headers(),
    body: null
  }))
};

global.NextResponse = mockNextResponse;

// Also mock it as a module
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => ({
      status: init?.status || 200,
      headers: new Headers(init?.headers),
      json: async () => body,
      body: JSON.stringify(body)
    })),
    redirect: jest.fn().mockImplementation((url, status = 302) => ({
      status,
      headers: new Headers({ Location: url }),
      url
    })),
    rewrite: jest.fn().mockImplementation((url) => ({
      status: 200,
      headers: new Headers(),
      url
    })),
    next: jest.fn().mockImplementation(() => ({
      status: 200,
      headers: new Headers(),
      body: null
    }))
  },
  NextRequest: class MockNextRequest {
    constructor(url, init = {}) {
      this.url = url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.nextUrl = new URL(url);
    }
  }
}))

// Add TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Add setImmediate for Prisma
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args))

// Mock fetch for tests
global.fetch = jest.fn()

// Add missing globals for MSW
global.TransformStream = TransformStream
global.ReadableStream = ReadableStream
global.WritableStream = WritableStream
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

// Suppress console errors in tests unless explicitly testing error handling
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
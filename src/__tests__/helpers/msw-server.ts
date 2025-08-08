import { setupServer } from 'msw/node'
import { handlers } from './msw-handlers'

// Setup MSW server for Node.js (tests)
export const server = setupServer(...handlers)

// Enable request interception
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers between tests
afterEach(() => server.resetHandlers())

// Clean up
afterAll(() => server.close())
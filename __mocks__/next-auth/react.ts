// Mock for next-auth/react
import { createMockSessionUser } from '../test-factories';

export const useSession = jest.fn(() => ({
  data: {
    user: createMockSessionUser('Teacher'),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  status: 'authenticated',
  update: jest.fn(),
}));

export const signIn = jest.fn(() => Promise.resolve({ ok: true }));
export const signOut = jest.fn(() => Promise.resolve());
export const getCsrfToken = jest.fn(() => Promise.resolve('mock-csrf-token'));
export const getProviders = jest.fn(() => Promise.resolve({}));

export const SessionProvider = ({ children }: { children: React.ReactNode }) => children;
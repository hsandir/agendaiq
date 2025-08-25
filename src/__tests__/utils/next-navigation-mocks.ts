/**
 * Next.js Navigation Mocks for Testing
 * Zero Degradation Protocol: Provides comprehensive mocks for Next.js navigation hooks
 */

// Mock useRouter
export const mockPush = jest.fn();
export const mockReplace = jest.fn();
export const mockPrefetch = jest.fn();
export const mockBack = jest.fn();
export const mockForward = jest.fn();
export const mockRefresh = jest.fn();

export const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  prefetch: mockPrefetch,
  back: mockBack,
  forward: mockForward,
  refresh: mockRefresh,
  asPath: '/',
  route: '/',
  query: {},
  pathname: '/',
  basePath: '',
  isLocaleDomain: true,
  isReady: true,
  isPreview: false,
};

// Mock useSearchParams
export const mockSearchParams = {
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  clear: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  toString: jest.fn(() => ''),
};
export const mockUseSearchParams = jest.fn(() => mockSearchParams);

// Mock usePathname
export const mockUsePathname = jest.fn(() => '/');

// Mock useParams
export const mockUseParams = jest.fn(() => ({}));

// Reset function for all mocks
export const resetNavigationMocks = () => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockPrefetch.mockClear();
  mockBack.mockClear();
  mockForward.mockClear();
  mockRefresh.mockClear();
  mockUseSearchParams.mockClear();
  mockUsePathname.mockClear();
  mockUseParams.mockClear();
  
  // Reset return values
  mockUseSearchParams.mockReturnValue(mockSearchParams);
  mockUsePathname.mockReturnValue('/');
  mockUseParams.mockReturnValue({});
  
  // Reset search params mock methods
  Object.values(mockSearchParams).forEach(mockFn => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
  mockSearchParams.get.mockReturnValue(null);
  mockSearchParams.has.mockReturnValue(false);
  mockSearchParams.toString.mockReturnValue('');
};

// Setup function to configure mocks
export const setupNavigationMocks = () => {
  jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: mockUseSearchParams,
    usePathname: mockUsePathname,
    useParams: mockUseParams,
    redirect: jest.fn(),
    notFound: jest.fn(),
  }));
  
  resetNavigationMocks();
};
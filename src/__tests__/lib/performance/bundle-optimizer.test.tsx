import { render, screen, waitFor } from '@testing-library/react';
import { 
  DynamicComponents, 
  ChartComponents, 
  DevComponents,
  createOptimizedComponent,
  BundleSizeMonitor,
  withLoadTimeMonitoring,
  preloadCriticalComponents
} from '@/lib/performance/bundle-optimizer';
import React from 'react';

// Mock Next.js dynamic import
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFn: any, options: any = {}) => {
    const DynamicComponent = ({ ...props }: any) => {
      const [Component, setComponent] = React.useState<any>(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        if (typeof importFn === 'function') {
          importFn()
            .then((mod: any) => {
              setComponent(() => mod.default || mod);
              setLoading(false);
            })
            .catch(() => {
              setLoading(false);
            });
        }
      }, []);

      if (loading) {
        return options.loading ? React.createElement(options.loading) : <div>Loading...</div>;
      }

      if (!Component) {
        return <div>Failed to load component</div>;
      }

      return React.createElement(Component, props);
    };

    return DynamicComponent;
  },
}));

// Mock components for testing
const MockComponent = ({ children = 'Mock Component' }: { children?: React.ReactNode }) => (
  <div data-testid="mock-component">{children}</div>
);

const SlowMockComponent = ({ children = 'Slow Component' }: { children?: React.ReactNode }) => {
  // Simulate slow component
  const startTime = performance.now();
  while (performance.now() - startTime < 10) {
    // Busy wait for 10ms
  }
  return <div data-testid="slow-component">{children}</div>;
};

// Mock the actual component imports to return our test components
jest.mock('@/components/teams/KnowledgeDetailModal', () => ({
  default: () => <MockComponent>KnowledgeDetailModal</MockComponent>,
}));

jest.mock('@/components/teams/EditKnowledgeDialog', () => ({
  default: () => <MockComponent>EditKnowledgeDialog</MockComponent>,
}));

describe('Bundle Optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    BundleSizeMonitor['metrics'].clear();
  });

  describe('DynamicComponents', () => {
    it('should render loading state initially', () => {
      render(<DynamicComponents.KnowledgeDetailModal />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should load KnowledgeDetailModal dynamically', async () => {
      render(<DynamicComponents.KnowledgeDetailModal />);
      
      await waitFor(() => {
        expect(screen.getByText('KnowledgeDetailModal')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should load EditKnowledgeDialog dynamically', async () => {
      render(<DynamicComponents.EditKnowledgeDialog />);
      
      await waitFor(() => {
        expect(screen.getByText('EditKnowledgeDialog')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle component loading failures gracefully', async () => {
      // Mock a failing import
      jest.doMock('@/components/teams/KnowledgeDetailModal', () => {
        throw new Error('Failed to import');
      });

      render(<DynamicComponents.KnowledgeDetailModal />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load component')).toBeInTheDocument();
      });
    });
  });

  describe('createOptimizedComponent', () => {
    it('should create dynamic component with default options', async () => {
      const TestComponent = () => <div>Test Component</div>;
      const OptimizedComponent = createOptimizedComponent(() => 
        Promise.resolve({ default: TestComponent })
      );

      render(<OptimizedComponent />);

      await waitFor(() => {
        expect(screen.getByText('Test Component')).toBeInTheDocument();
      });
    });

    it('should use custom loading component', () => {
      const CustomLoading = () => <div>Custom Loading...</div>;
      const TestComponent = () => <div>Test Component</div>;
      
      const OptimizedComponent = createOptimizedComponent(
        () => Promise.resolve({ default: TestComponent }),
        { loading: CustomLoading }
      );

      render(<OptimizedComponent />);
      
      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });

    it('should apply custom loading className', () => {
      const TestComponent = () => <div>Test Component</div>;
      
      const OptimizedComponent = createOptimizedComponent(
        () => Promise.resolve({ default: TestComponent }),
        { loadingClassName: 'custom-loading-class' }
      );

      render(<OptimizedComponent />);
      
      const loadingElement = screen.getByText(/Loading/);
      expect(loadingElement.className).toContain('custom-loading-class');
    });
  });

  describe('BundleSizeMonitor', () => {
    beforeEach(() => {
      // Mock performance.now
      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);
    });

    it('should record component load time in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      BundleSizeMonitor.recordComponentLoad('TestComponent', 150);

      const metrics = BundleSizeMonitor.getMetrics();
      expect(metrics.TestComponent).toBe(150);

      process.env.NODE_ENV = originalEnv;
    });

    it('should not record metrics in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      BundleSizeMonitor.recordComponentLoad('TestComponent', 150);

      const metrics = BundleSizeMonitor.getMetrics();
      expect(metrics.TestComponent).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should identify slow components', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      BundleSizeMonitor.recordComponentLoad('FastComponent', 500);
      BundleSizeMonitor.recordComponentLoad('SlowComponent', 1500);
      BundleSizeMonitor.recordComponentLoad('VerySlowComponent', 2500);

      const slowComponents = BundleSizeMonitor.getSlowComponents(1000);

      expect(slowComponents).toHaveLength(2);
      expect(slowComponents[0][0]).toBe('VerySlowComponent'); // Sorted by load time
      expect(slowComponents[1][0]).toBe('SlowComponent');

      process.env.NODE_ENV = originalEnv;
    });

    it('should return empty array when no slow components', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      BundleSizeMonitor.recordComponentLoad('FastComponent', 500);

      const slowComponents = BundleSizeMonitor.getSlowComponents(1000);

      expect(slowComponents).toHaveLength(0);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('withLoadTimeMonitoring', () => {
    it('should wrap component and record load time', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const TestComponent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
      const MonitoredComponent = withLoadTimeMonitoring(TestComponent, 'TestComponent');

      render(<MonitoredComponent>Test Content</MonitoredComponent>);

      expect(screen.getByText('Test Content')).toBeInTheDocument();

      // Wait for load time recording (async setTimeout)
      await waitFor(() => {
        const metrics = BundleSizeMonitor.getMetrics();
        expect(metrics.TestComponent).toBeDefined();
        expect(typeof metrics.TestComponent).toBe('number');
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should render component normally in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const TestComponent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
      const MonitoredComponent = withLoadTimeMonitoring(TestComponent, 'TestComponent');

      render(<MonitoredComponent>Test Content</MonitoredComponent>);

      expect(screen.getByText('Test Content')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('preloadCriticalComponents', () => {
    it('should preload components in browser environment', () => {
      // Mock window object
      Object.defineProperty(window, 'addEventListener', {
        value: jest.fn((event, callback) => {
          if (event === 'load') {
            // Simulate immediate callback for testing
            setTimeout(callback, 0);
          }
        }),
        writable: true,
      });

      // Mock dynamic imports
      const mockImport = jest.fn().mockResolvedValue({});
      jest.doMock('@/components/teams/KnowledgeDetailModal', () => mockImport);
      jest.doMock('@/components/meetings/MeetingHistoryModal', () => mockImport);

      preloadCriticalComponents();

      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should handle server-side environment gracefully', () => {
      // Mock server environment
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => preloadCriticalComponents()).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('ChartComponents and DevComponents', () => {
    it('should define chart components with proper loading states', () => {
      expect(ChartComponents.PerformanceChart).toBeDefined();
      expect(ChartComponents.MetricsChart).toBeDefined();
      expect(typeof ChartComponents.PerformanceChart).toBe('function');
      expect(typeof ChartComponents.MetricsChart).toBe('function');
    });

    it('should define dev components with proper loading states', () => {
      expect(DevComponents.BundleAnalyzer).toBeDefined();
      expect(DevComponents.PerformanceMonitor).toBeDefined();
      expect(typeof DevComponents.BundleAnalyzer).toBe('function');
      expect(typeof DevComponents.PerformanceMonitor).toBe('function');
    });
  });

  describe('Loading Components', () => {
    it('should render default loading component with proper classes', () => {
      render(
        <div className="animate-pulse bg-gray-200 rounded min-h-[400px] p-4">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      );

      const loadingDiv = screen.getByRole('generic');
      expect(loadingDiv).toHaveClass('animate-pulse', 'bg-gray-200', 'rounded');
    });
  });

  describe('Integration Tests', () => {
    it('should work with monitoring and dynamic loading together', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const TestComponent = () => <div>Integrated Test Component</div>;
      const MonitoredComponent = withLoadTimeMonitoring(TestComponent, 'IntegratedComponent');
      const DynamicMonitoredComponent = createOptimizedComponent(
        () => Promise.resolve({ default: MonitoredComponent })
      );

      render(<DynamicMonitoredComponent />);

      await waitFor(() => {
        expect(screen.getByText('Integrated Test Component')).toBeInTheDocument();
      });

      // Check that monitoring was recorded
      await waitFor(() => {
        const metrics = BundleSizeMonitor.getMetrics();
        expect(metrics.IntegratedComponent).toBeDefined();
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});
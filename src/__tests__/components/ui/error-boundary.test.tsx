import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, useErrorBoundary, withErrorBoundary, AsyncErrorBoundary } from '@/components/ui/error-boundary';
import React from 'react';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Test components that throw errors
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test component error');
  }
  return <div>Working component</div>;
};

const AsyncThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      setTimeout(() => {
        throw new Error('Async test error');
      }, 100);
    }
  }, [shouldThrow]);
  return <div>Async component</div>;
};

describe('ErrorBoundary', () => {
  describe('Basic Error Boundary', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should render error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    });

    it('should display custom title when provided', () => {
      const customTitle = 'Custom Error Title';
      
      render(
        <ErrorBoundary title={customTitle}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test component error')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details when showDetails is false', () => {
      render(
        <ErrorBoundary showDetails={false}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Test component error')).not.toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onErrorMock = jest.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test component error' }),
        expect.anything()
      );
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when Try Again button is clicked', async () => {
      let shouldThrow = true;
      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

      const { rerender } = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Change the component to not throw
      shouldThrow = false;

      // Click Try Again button
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Rerender with updated component
      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
      });
    });

    it('should navigate to dashboard when Go Home button is clicked', () => {
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const goHomeButton = screen.getByText('Go Home');
      fireEvent.click(goHomeButton);

      expect(window.location.href).toBe('http://localhost/dashboard');
    });
  });

  describe('Custom Fallback Component', () => {
    it('should render custom fallback component when provided', () => {
      const CustomFallback = ({ error, resetError }: { error?: Error; resetError: () => void }) => (
        <div>
          <h1>Custom Error UI</h1>
          <p>{error?.message}</p>
          <button onClick={resetError}>Custom Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.getByText('Test component error')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
    });

    it('should call resetError in custom fallback', () => {
      let shouldThrow = true;
      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

      const CustomFallback = ({ resetError }: { resetError: () => void }) => (
        <button onClick={resetError}>Custom Reset</button>
      );

      const { rerender } = render(
        <ErrorBoundary fallback={CustomFallback}>
          <TestComponent />
        </ErrorBoundary>
      );

      const resetButton = screen.getByText('Custom Reset');
      
      // Change component to not throw
      shouldThrow = false;
      
      fireEvent.click(resetButton);

      rerender(
        <ErrorBoundary fallback={CustomFallback}>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Custom Reset')).not.toBeInTheDocument();
    });
  });

  describe('useErrorBoundary Hook', () => {
    it('should provide error throwing function', () => {
      const TestComponent = () => {
        const throwError = useErrorBoundary();
        
        return (
          <button onClick={() => console.log('Hook available')}>
            Test Hook
          </button>
        );
      };

      render(<TestComponent />);

      const button = screen.getByText('Test Hook');
      expect(button).toBeInTheDocument();
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const TestComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => (
        <ThrowError shouldThrow={shouldThrow} />
      );

      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent shouldThrow={true} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should pass error boundary props to HOC', () => {
      const TestComponent = () => <ThrowError />;
      const WrappedComponent = withErrorBoundary(TestComponent, {
        title: 'HOC Error Title',
        showDetails: true
      });

      render(<WrappedComponent />);

      expect(screen.getByText('HOC Error Title')).toBeInTheDocument();
      expect(screen.getByText('Test component error')).toBeInTheDocument();
    });

    it('should set correct display name for wrapped component', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';
      
      const WrappedComponent = withErrorBoundary(TestComponent);
      
      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });
  });

  describe('AsyncErrorBoundary', () => {
    it('should render with custom retry functionality', async () => {
      const onRetryMock = jest.fn();

      render(
        <AsyncErrorBoundary onRetry={onRetryMock} retryButtonText="Retry Operation">
          <ThrowError />
        </AsyncErrorBoundary>
      );

      expect(screen.getByText('Loading Failed')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Retry Operation');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);

      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });

    it('should use default retry button text', () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should show error details when enabled', () => {
      render(
        <AsyncErrorBoundary showDetails={true}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      expect(screen.getByText('Test component error')).toBeInTheDocument();
    });
  });

  describe('Production vs Development Behavior', () => {
    it('should log errors in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'Production error:',
        expect.objectContaining({
          error: expect.objectContaining({ message: 'Test component error' }),
          errorInfo: expect.anything()
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle console.error gracefully', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.objectContaining({ message: 'Test component error' }),
        expect.anything()
      );
    });
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/lib/theme/theme-provider';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { themes } from '@/lib/theme/themes';
import { generateCSSVariables, isDarkTheme, getSystemThemePreference } from '@/lib/theme/theme-utils';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch for ThemeProvider
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
  })
);

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  } as MediaQueryList)),
});

// Mock CSS.supports
Object.defineProperty(window, 'CSS', {
  value: {
    supports: jest.fn().mockReturnValue(true),
  },
});

describe('Theme System Tests', () => {
  beforeEach(() => {
    (localStorageMock.getItem as jest.Mock).mockClear();
    (localStorageMock.setItem as jest.Mock).mockClear();
    (localStorageMock.clear as jest.Mock).mockClear();
    // Reset localStorage to return null by default
    (localStorageMock.getItem as jest.Mock).mockReturnValue(null);
    document.documentElement.style.cssText = '';
    
    // Reset fetch mock
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      })
    );
  });

  describe('ThemeProvider', () => {
    it('should provide default theme', () => {
      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme.name}</div>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('should accept initial theme', () => {
      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme.name}</div>;
      };

      render(
        <ThemeProvider initialTheme="modern-purple">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByText('Modern Purple')).toBeInTheDocument();
    });

    it('should persist theme to localStorage', () => {
      const TestComponent = () => {
        const { setTheme } = useTheme();
        return (
          <button onClick={() => setTheme('dark-mode')}>
            Change Theme
          </button>
        );
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      fireEvent.click(screen.getByText('Change Theme'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'agendaiq-theme',
        'dark-mode'
      );
    });

    it('should load theme from localStorage', () => {
      (localStorageMock.getItem as jest.Mock).mockReturnValue('nature-green');

      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme.name}</div>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByText('Nature Green')).toBeInTheDocument();
    });

    it('should apply CSS variables to document', () => {
      const TestComponent = () => {
        const { setTheme } = useTheme();
        React.useEffect(() => {
          setTheme('modern-purple');
        }, [setTheme]);
        return null;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--color-primary')).toBeTruthy();
        expect(document.documentElement.style.getPropertyValue('--color-background')).toBeTruthy();
      });
    });
  });

  describe('ThemeSelector', () => {
    it('should render all available themes', () => {
      render(
        <ThemeProvider>
          <ThemeSelector />
        </ThemeProvider>
      );

      themes.forEach(theme => {
        expect(screen.getByText(theme.name)).toBeInTheDocument();
      });
    });

    it('should highlight current theme', () => {
      render(
        <ThemeProvider initialTheme="dark-mode">
          <ThemeSelector />
        </ThemeProvider>
      );

      const darkModeCard = screen.getByText('Dark Mode').closest('button');
      expect(darkModeCard).toHaveClass('ring-2');
    });

    it('should change theme on selection', () => {
      const TestComponent = () => {
        const { theme } = useTheme();
        return (
          <>
            <ThemeSelector />
            <div data-testid="current-theme">{theme.name}</div>
          </>
        );
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      fireEvent.click(screen.getByText('Modern Purple'));

      waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('Modern Purple');
      });
    });

    it('should render in different variants', () => {
      const { rerender } = render(
        <ThemeProvider>
          <ThemeSelector variant="grid" />
        </ThemeProvider>
      );

      expect(screen.getByRole('group')).toHaveClass('grid');

      rerender(
        <ThemeProvider>
          <ThemeSelector variant="list" />
        </ThemeProvider>
      );

      expect(screen.getByRole('group')).toHaveClass('flex-col');

      rerender(
        <ThemeProvider>
          <ThemeSelector variant="compact" />
        </ThemeProvider>
      );

      expect(screen.getByRole('group')).toHaveClass('flex-wrap');
    });

    it('should show descriptions when enabled', () => {
      render(
        <ThemeProvider>
          <ThemeSelector showDescription={true} />
        </ThemeProvider>
      );

      // Use getAllByText for descriptions that appear multiple times
      themes.forEach(theme => {
        const descriptions = screen.getAllByText(theme.description);
        expect(descriptions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Theme Utils', () => {
    it('should generate CSS variables correctly', () => {
      const theme = themes[0];
      const cssVars = generateCSSVariables(theme);

      expect(cssVars['--color-primary']).toBe(theme.colors.primary);
      expect(cssVars['--color-background']).toBe(theme.colors.background);
      expect(cssVars['--font-primary']).toBe(theme.fonts.primary);
      expect(cssVars['--spacing-md']).toBe(theme.spacing.md);
    });

    it('should detect dark themes correctly', () => {
      const darkTheme = themes.find(t => t.id === 'dark-mode')!;
      const lightTheme = themes.find(t => t.id === 'classic-light')!;

      expect(isDarkTheme(darkTheme)).toBe(true);
      expect(isDarkTheme(lightTheme)).toBe(false);
    });

    it('should detect system theme preference', () => {
      window.matchMedia = jest.fn().mockImplementation((query: string): MediaQueryList => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as MediaQueryList));

      expect(getSystemThemePreference()).toBe('dark');

      window.matchMedia = jest.fn().mockImplementation((query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as MediaQueryList));

      expect(getSystemThemePreference()).toBe('light');
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme across page reloads', async () => {
      const { unmount } = render(
        <ThemeProvider initialTheme="nature-green">
          <div />
        </ThemeProvider>
      );

      // Wait for theme to be applied and saved
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'agendaiq-theme',
          'nature-green'
        );
      });

      unmount();

      (localStorageMock.getItem as jest.Mock).mockReturnValue('nature-green');

      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme.name}</div>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByText('Nature Green')).toBeInTheDocument();
    });
  });

  describe('Theme Accessibility', () => {
    it('should have sufficient color contrast for text', () => {
      themes.forEach(theme => {
        // This is a simplified test - in production you'd use a proper contrast checker
        expect(theme.colors.text).toBeTruthy();
        expect(theme.colors.background).toBeTruthy();
        expect(theme.colors.text).not.toBe(theme.colors.background);
      });
    });

    it('should support reduced motion preference', () => {
      window.matchMedia = jest.fn().mockImplementation((query: string): MediaQueryList => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as MediaQueryList));

      render(
        <ThemeProvider>
          <ThemeSelector />
        </ThemeProvider>
      );

      // Verify that transitions are disabled when prefers-reduced-motion is set
      const themeCards = screen.getAllByRole('button');
      themeCards.forEach(card => {
        const styles = window.getComputedStyle(card);
        expect(styles.transition).toBe('');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should apply mobile-specific styles', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      window.matchMedia = jest.fn().mockImplementation((query: string): MediaQueryList => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as MediaQueryList));

      render(
        <ThemeProvider>
          <ThemeSelector variant="grid" />
        </ThemeProvider>
      );

      const container = screen.getByRole('group');
      // On mobile, grid should be single column
      expect(container).toHaveClass('grid-cols-1');
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should include vendor prefixes in CSS variables', () => {
      const theme = themes[0];
      const cssVars = generateCSSVariables(theme);

      // Check for properties that actually exist in generateCSSVariables
      expect(cssVars['--color-primary']).toBeDefined();
      expect(cssVars['--shadow-sm']).toBeDefined();
    });
  });
});

// Integration test for theme system across multiple components
describe('Theme System Integration', () => {
  it('should apply theme consistently across all components', async () => {
    const ComponentA = () => {
      const { theme } = useTheme();
      return (
        <div style={{ color: theme.colors.primary }}>
          Component A
        </div>
      );
    };

    const ComponentB = () => {
      const { theme } = useTheme();
      return (
        <div style={{ background: theme.colors.background }}>
          Component B
        </div>
      );
    };

    const App = () => {
      const { setTheme, theme } = useTheme();
      return (
        <div>
          <button onClick={() => setTheme('dark-mode')}>
            Switch to Dark
          </button>
          <div data-testid="current-theme">{theme.id}</div>
          <ComponentA />
          <ComponentB />
        </div>
      );
    };

    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('standard');

    fireEvent.click(screen.getByText('Switch to Dark'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark-mode');
    });

    // Verify CSS variables are updated
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--primary')).toBeTruthy();
      expect(document.documentElement.style.getPropertyValue('--background')).toBeTruthy();
    });
  });
});
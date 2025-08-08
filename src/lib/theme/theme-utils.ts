// Theme utility functions for CSS variable generation and theme management

import { Theme } from './themes';

// Generate CSS variables from theme object
export function generateCSSVariables(theme: Theme): Record<string, string> {
  const variables: Record<string, string> = {};
  
  // Helper function to convert camelCase to kebab-case
  const toKebabCase = (str: string) => {
    // First char lowercase, then add dash before uppercase letters
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
  };
  
  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    const kebabKey = toKebabCase(key);
    variables[`--color-${kebabKey}`] = value;
  });
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables[`--spacing-${key}`] = value;
  });
  
  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    variables[`--radius-${key}`] = value;
  });
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    variables[`--shadow-${key}`] = value;
  });
  
  // Fonts
  variables['--font-primary'] = theme.fonts.primary;
  variables['--font-secondary'] = theme.fonts.secondary;
  variables['--font-mono'] = theme.fonts.mono;
  
  return variables;
}

// Generate Tailwind CSS custom properties
export function generateTailwindConfig(theme: Theme): Record<string, any> {
  return {
    colors: {
      primary: {
        DEFAULT: theme.colors.primary,
        light: theme.colors.primaryLight,
        dark: theme.colors.primaryDark,
        foreground: theme.colors.primaryForeground,
      },
      secondary: {
        DEFAULT: theme.colors.secondary,
        light: theme.colors.secondaryLight,
        dark: theme.colors.secondaryDark,
        foreground: theme.colors.secondaryForeground,
      },
      background: {
        DEFAULT: theme.colors.background,
        secondary: theme.colors.backgroundSecondary,
        tertiary: theme.colors.backgroundTertiary,
      },
      text: {
        DEFAULT: theme.colors.text,
        secondary: theme.colors.textSecondary,
        muted: theme.colors.textMuted,
        inverse: theme.colors.textInverse,
      },
      border: {
        DEFAULT: theme.colors.border,
        light: theme.colors.borderLight,
        dark: theme.colors.borderDark,
      },
      success: {
        DEFAULT: theme.colors.success,
        light: theme.colors.successLight,
        dark: theme.colors.successDark,
      },
      warning: {
        DEFAULT: theme.colors.warning,
        light: theme.colors.warningLight,
        dark: theme.colors.warningDark,
      },
      error: {
        DEFAULT: theme.colors.error,
        light: theme.colors.errorLight,
        dark: theme.colors.errorDark,
      },
      info: {
        DEFAULT: theme.colors.info,
        light: theme.colors.infoLight,
        dark: theme.colors.infoDark,
      },
    },
    fontFamily: {
      primary: [theme.fonts.primary],
      secondary: [theme.fonts.secondary],
      mono: [theme.fonts.mono],
    },
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    boxShadow: theme.shadows,
  };
}

// Media query helper for responsive design
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Generate media queries
export function mediaQuery(breakpoint: keyof typeof breakpoints): string {
  return `@media (min-width: ${breakpoints[breakpoint]})`;
}

// Check if theme is dark
export function isDarkTheme(theme: Theme): boolean {
  return theme.id.includes('dark') || theme.id === 'modern-purple' || theme.id === 'high-contrast';
}

// Get contrast color
export function getContrastColor(color: string): string {
  // Simple contrast calculation
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Convert hex to rgba
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Theme validation
export function validateTheme(theme: Partial<Theme>): boolean {
  const requiredFields = ['id', 'name', 'colors', 'fonts', 'spacing', 'borderRadius', 'shadows'];
  return requiredFields.every(field => field in theme);
}

// Get system theme preference
export function getSystemThemePreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// Listen for system theme changes
export function watchSystemTheme(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  
  mediaQuery.addEventListener('change', handler);
  
  return () => mediaQuery.removeEventListener('change', handler);
}

// Generate CSS string for theme
export function generateThemeCSS(theme: Theme): string {
  const variables = generateCSSVariables(theme);
  const cssLines = Object.entries(variables).map(([key, value]) => `  ${key}: ${value};`);
  
  return `:root {\n${cssLines.join('\n')}\n}`;
}

// Create theme-aware class names
export function themeClass(baseClass: string, theme: Theme, variants?: Record<string, string>): string {
  const classes = [baseClass];
  
  if (variants) {
    Object.entries(variants).forEach(([condition, className]) => {
      if (condition === 'dark' && isDarkTheme(theme)) {
        classes.push(className);
      }
    });
  }
  
  return classes.join(' ');
}
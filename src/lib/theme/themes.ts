// Centralized Theme System for AgendaIQ
// Supports 5 themes with full mobile and cross-browser compatibility

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryForeground: string;
    
    // Secondary colors
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    secondaryForeground: string;
    
    // Background colors
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    
    // Card colors
    card: string;
    cardHover: string;
    cardBorder: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    
    // Border colors
    border: string;
    borderLight: string;
    borderDark: string;
    
    // Status colors
    success: string;
    successLight: string;
    successDark: string;
    
    warning: string;
    warningLight: string;
    warningDark: string;
    
    error: string;
    errorLight: string;
    errorDark: string;
    
    info: string;
    infoLight: string;
    infoDark: string;
    
    // UI elements
    sidebar: string;
    sidebarText: string;
    sidebarHover: string;
    sidebarActive: string;
    
    header: string;
    headerText: string;
    
    // Form elements
    input: string;
    inputBorder: string;
    inputFocus: string;
    inputText: string;
    inputPlaceholder: string;
    
    // Button variants
    buttonPrimary: string;
    buttonPrimaryHover: string;
    buttonPrimaryText: string;
    
    buttonSecondary: string;
    buttonSecondaryHover: string;
    buttonSecondaryText: string;
    
    buttonGhost: string;
    buttonGhostHover: string;
    buttonGhostText: string;
    
    // Misc
    overlay: string;
    shadow: string;
    scrollbar: string;
    scrollbarThumb: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Theme 1: Modern Purple (Based on provided design)
export const modernPurpleTheme: Theme = {
  id: 'modern-purple',
  name: 'Modern Purple',
  description: 'Modern dark theme with purple accents based on the new design',
  colors: {
    primary: '#7C3AED',
    primaryLight: '#8B5CF6',
    primaryDark: '#6D28D9',
    primaryForeground: '#FFFFFF',
    
    secondary: '#EC4899',
    secondaryLight: '#F472B6',
    secondaryDark: '#DB2777',
    secondaryForeground: '#FFFFFF',
    
    background: '#1A1B3A',
    backgroundSecondary: '#252647',
    backgroundTertiary: '#2D2F56',
    
    card: '#252647',
    cardHover: '#2D2F56',
    cardBorder: '#3A3C5E',
    
    text: '#FFFFFF',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    textInverse: '#0F172A',
    
    border: '#3A3C5E',
    borderLight: '#4A4C6E',
    borderDark: '#2A2C4E',
    
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706',
    
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    
    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoDark: '#2563EB',
    
    sidebar: '#1A1B3A',
    sidebarText: '#E2E8F0',
    sidebarHover: '#2D2F56',
    sidebarActive: '#7C3AED',
    
    header: '#1A1B3A',
    headerText: '#FFFFFF',
    
    input: '#2D2F56',
    inputBorder: '#3A3C5E',
    inputFocus: '#7C3AED',
    inputText: '#FFFFFF',
    inputPlaceholder: '#64748B',
    
    buttonPrimary: '#7C3AED',
    buttonPrimaryHover: '#8B5CF6',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#3A3C5E',
    buttonSecondaryHover: '#4A4C6E',
    buttonSecondaryText: '#FFFFFF',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(124, 58, 237, 0.1)',
    buttonGhostText: '#7C3AED',
    
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    scrollbar: '#2D2F56',
    scrollbarThumb: '#4A4C6E',
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    secondary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, Inconsolata, "Fira Code", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
  },
};

// Theme 2: Classic Light (Current design)
export const classicLightTheme: Theme = {
  id: 'classic-light',
  name: 'Classic Light',
  description: 'Clean and professional light theme',
  colors: {
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    primaryForeground: '#FFFFFF',
    
    secondary: '#8B5CF6',
    secondaryLight: '#A78BFA',
    secondaryDark: '#7C3AED',
    secondaryForeground: '#FFFFFF',
    
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
    
    card: '#FFFFFF',
    cardHover: '#F9FAFB',
    cardBorder: '#E5E7EB',
    
    text: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706',
    
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    
    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoDark: '#2563EB',
    
    sidebar: '#FFFFFF',
    sidebarText: '#111827',
    sidebarHover: '#F3F4F6',
    sidebarActive: '#3B82F6',
    
    header: '#FFFFFF',
    headerText: '#111827',
    
    input: '#FFFFFF',
    inputBorder: '#D1D5DB',
    inputFocus: '#3B82F6',
    inputText: '#111827',
    inputPlaceholder: '#9CA3AF',
    
    buttonPrimary: '#3B82F6',
    buttonPrimaryHover: '#2563EB',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#6B7280',
    buttonSecondaryHover: '#4B5563',
    buttonSecondaryText: '#FFFFFF',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(59, 130, 246, 0.1)',
    buttonGhostText: '#3B82F6',
    
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    scrollbar: '#E5E7EB',
    scrollbarThumb: '#9CA3AF',
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    secondary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, Inconsolata, "Fira Code", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
};

// Theme 3: Dark Mode
export const darkModeTheme: Theme = {
  id: 'dark-mode',
  name: 'Dark Mode',
  description: 'Modern dark theme for reduced eye strain',
  colors: {
    primary: '#60A5FA',
    primaryLight: '#93C5FD',
    primaryDark: '#3B82F6',
    primaryForeground: '#0F172A',
    
    secondary: '#A78BFA',
    secondaryLight: '#C4B5FD',
    secondaryDark: '#8B5CF6',
    secondaryForeground: '#0F172A',
    
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',
    
    card: '#1E293B',
    cardHover: '#334155',
    cardBorder: '#475569',
    
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textInverse: '#0F172A',
    
    border: '#475569',
    borderLight: '#64748B',
    borderDark: '#334155',
    
    success: '#34D399',
    successLight: '#6EE7B7',
    successDark: '#10B981',
    
    warning: '#FCD34D',
    warningLight: '#FDE68A',
    warningDark: '#F59E0B',
    
    error: '#F87171',
    errorLight: '#FCA5A5',
    errorDark: '#EF4444',
    
    info: '#60A5FA',
    infoLight: '#93C5FD',
    infoDark: '#3B82F6',
    
    sidebar: '#1E293B',
    sidebarText: '#CBD5E1',
    sidebarHover: '#334155',
    sidebarActive: '#60A5FA',
    
    header: '#1E293B',
    headerText: '#F1F5F9',
    
    input: '#334155',
    inputBorder: '#475569',
    inputFocus: '#60A5FA',
    inputText: '#F1F5F9',
    inputPlaceholder: '#64748B',
    
    buttonPrimary: '#60A5FA',
    buttonPrimaryHover: '#3B82F6',
    buttonPrimaryText: '#0F172A',
    
    buttonSecondary: '#475569',
    buttonSecondaryHover: '#64748B',
    buttonSecondaryText: '#F1F5F9',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(96, 165, 250, 0.1)',
    buttonGhostText: '#60A5FA',
    
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    scrollbar: '#334155',
    scrollbarThumb: '#64748B',
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    secondary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, Inconsolata, "Fira Code", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.25)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.35)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.4)',
  },
};

// Theme 4: High Contrast
export const highContrastTheme: Theme = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Maximum contrast for accessibility',
  colors: {
    primary: '#000000',
    primaryLight: '#1F1F1F',
    primaryDark: '#000000',
    primaryForeground: '#FFFFFF',
    
    secondary: '#FFFFFF',
    secondaryLight: '#FFFFFF',
    secondaryDark: '#F0F0F0',
    secondaryForeground: '#000000',
    
    background: '#FFFFFF',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#FFFFFF',
    
    card: '#FFFFFF',
    cardHover: '#F0F0F0',
    cardBorder: '#000000',
    
    text: '#000000',
    textSecondary: '#000000',
    textMuted: '#333333',
    textInverse: '#FFFFFF',
    
    border: '#000000',
    borderLight: '#333333',
    borderDark: '#000000',
    
    success: '#008000',
    successLight: '#00A000',
    successDark: '#006000',
    
    warning: '#FFA500',
    warningLight: '#FFB500',
    warningDark: '#FF9500',
    
    error: '#FF0000',
    errorLight: '#FF3333',
    errorDark: '#CC0000',
    
    info: '#0000FF',
    infoLight: '#3333FF',
    infoDark: '#0000CC',
    
    sidebar: '#000000',
    sidebarText: '#FFFFFF',
    sidebarHover: '#1F1F1F',
    sidebarActive: '#FFFFFF',
    
    header: '#000000',
    headerText: '#FFFFFF',
    
    input: '#FFFFFF',
    inputBorder: '#000000',
    inputFocus: '#0000FF',
    inputText: '#000000',
    inputPlaceholder: '#666666',
    
    buttonPrimary: '#000000',
    buttonPrimaryHover: '#333333',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#FFFFFF',
    buttonSecondaryHover: '#F0F0F0',
    buttonSecondaryText: '#000000',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(0, 0, 0, 0.1)',
    buttonGhostText: '#000000',
    
    overlay: 'rgba(0, 0, 0, 0.9)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    scrollbar: '#CCCCCC',
    scrollbarThumb: '#000000',
  },
  fonts: {
    primary: 'Arial, Helvetica, sans-serif',
    secondary: 'Arial, Helvetica, sans-serif',
    mono: 'Courier New, monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0',
    md: '0',
    lg: '0',
    xl: '0',
    full: '0',
  },
  shadows: {
    none: 'none',
    sm: '0 0 0 2px #000000',
    md: '0 0 0 2px #000000',
    lg: '0 0 0 3px #000000',
    xl: '0 0 0 4px #000000',
  },
};

// Theme 5: Nature Green
export const natureGreenTheme: Theme = {
  id: 'nature-green',
  name: 'Nature Green',
  description: 'Calming green theme inspired by nature',
  colors: {
    primary: '#059669',
    primaryLight: '#10B981',
    primaryDark: '#047857',
    primaryForeground: '#FFFFFF',
    
    secondary: '#84CC16',
    secondaryLight: '#A3E635',
    secondaryDark: '#65A30D',
    secondaryForeground: '#FFFFFF',
    
    background: '#F0FDF4',
    backgroundSecondary: '#DCFCE7',
    backgroundTertiary: '#BBF7D0',
    
    card: '#FFFFFF',
    cardHover: '#F0FDF4',
    cardBorder: '#86EFAC',
    
    text: '#14532D',
    textSecondary: '#166534',
    textMuted: '#16A34A',
    textInverse: '#FFFFFF',
    
    border: '#86EFAC',
    borderLight: '#BBF7D0',
    borderDark: '#4ADE80',
    
    success: '#059669',
    successLight: '#10B981',
    successDark: '#047857',
    
    warning: '#EAB308',
    warningLight: '#FDE047',
    warningDark: '#CA8A04',
    
    error: '#DC2626',
    errorLight: '#EF4444',
    errorDark: '#B91C1C',
    
    info: '#0284C7',
    infoLight: '#0EA5E9',
    infoDark: '#0369A1',
    
    sidebar: '#ECFDF5',
    sidebarText: '#14532D',
    sidebarHover: '#D1FAE5',
    sidebarActive: '#059669',
    
    header: '#FFFFFF',
    headerText: '#14532D',
    
    input: '#FFFFFF',
    inputBorder: '#86EFAC',
    inputFocus: '#059669',
    inputText: '#14532D',
    inputPlaceholder: '#16A34A',
    
    buttonPrimary: '#059669',
    buttonPrimaryHover: '#047857',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#86EFAC',
    buttonSecondaryHover: '#4ADE80',
    buttonSecondaryText: '#14532D',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(5, 150, 105, 0.1)',
    buttonGhostText: '#059669',
    
    overlay: 'rgba(20, 83, 45, 0.5)',
    shadow: 'rgba(20, 83, 45, 0.1)',
    scrollbar: '#BBF7D0',
    scrollbarThumb: '#059669',
  },
  fonts: {
    primary: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondary: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, Inconsolata, "Fira Code", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(20, 83, 45, 0.05)',
    md: '0 4px 6px rgba(20, 83, 45, 0.1)',
    lg: '0 10px 15px rgba(20, 83, 45, 0.1)',
    xl: '0 20px 25px rgba(20, 83, 45, 0.1)',
  },
};

// Export all themes
export const themes: Theme[] = [
  modernPurpleTheme,
  classicLightTheme,
  darkModeTheme,
  highContrastTheme,
  natureGreenTheme,
];

// Get theme by ID
export const getThemeById = (id: string): Theme => {
  return themes.find(theme => theme.id === id) || classicLightTheme;
};

// Default theme
export const defaultTheme = classicLightTheme;
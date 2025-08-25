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
    scrollbarThumb: string
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string
  };
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string
  };
}

// Theme 1: Modern Purple (Based on provided design)
export const modernPurpleTheme: Theme = {
  id: 'modern-purple',
  name: 'Modern Purple',
  description: 'Modern dark theme with purple accents based on the new design',
  colors: {
    primary: '#A855F7',
    primaryLight: '#C084FC',
    primaryDark: '#9333EA',
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
    textSecondary: '#CBD5E1',
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
    sidebarActive: '#A855F7',
    
    header: '#1A1B3A',
    headerText: '#FFFFFF',
    
    input: '#2D2F56',
    inputBorder: '#3A3C5E',
    inputFocus: '#A855F7',
    inputText: '#FFFFFF',
    inputPlaceholder: '#64748B',
    
    buttonPrimary: '#A855F7',
    buttonPrimaryHover: '#C084FC',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#3A3C5E',
    buttonSecondaryHover: '#4A4C6E',
    buttonSecondaryText: '#FFFFFF',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(124, 58, 237, 0.1)',
    buttonGhostText: '#A855F7',
    
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

// Theme X: Midnight Blue (Modern Dark Theme)
export const midnightBlueTheme: Theme = {
  id: 'midnight-blue',
  name: 'Midnight Blue',
  description: 'Professional dark theme with blue accents and soft shadows',
  colors: {
    primary: '#4A64F0',
    primaryLight: '#6B7DF2',
    primaryDark: '#3B52ED',
    primaryForeground: '#FFFFFF',
    
    secondary: '#7B4AF0',
    secondaryLight: '#9563F2',
    secondaryDark: '#6B3BED',
    secondaryForeground: '#FFFFFF',
    
    background: '#0E1321',
    backgroundSecondary: '#1D2536',
    backgroundTertiary: '#2A3441',
    
    card: '#1D2536',
    cardHover: '#2A3441',
    cardBorder: '#3A4753',
    
    text: '#FFFFFF',
    textSecondary: '#E1E5E9',
    textMuted: '#5B6A85',
    textInverse: '#0E1321',
    
    border: '#3A4753',
    borderLight: '#4A5764',
    borderDark: '#2A3441',
    
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    
    warning: '#F0A44A',
    warningLight: '#F2B866',
    warningDark: '#ED9433',
    
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    
    info: '#4A64F0',
    infoLight: '#6B7DF2',
    infoDark: '#3B52ED',
    
    sidebar: '#0E1321',
    sidebarText: '#E1E5E9',
    sidebarHover: '#1D2536',
    sidebarActive: '#4A64F0',
    
    header: '#0E1321',
    headerText: '#FFFFFF',
    
    input: '#1D2536',
    inputBorder: '#3A4753',
    inputFocus: '#4A64F0',
    inputText: '#FFFFFF',
    inputPlaceholder: '#5B6A85',
    
    buttonPrimary: '#4A64F0',
    buttonPrimaryHover: '#3B52ED',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#3A4753',
    buttonSecondaryHover: '#4A5764',
    buttonSecondaryText: '#FFFFFF',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(74, 100, 240, 0.12)',
    buttonGhostText: '#4A64F0',
    
    overlay: 'rgba(14, 19, 33, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.25)',
    scrollbar: '#1D2536',
    scrollbarThumb: '#4A5764',
  },
  fonts: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    secondary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, Inconsolata, "Fira Code", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.75rem',
    xxl: '2.5rem',
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
    sm: '0 1px 2px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)', // shadow-soft
    lg: '0 10px 20px rgba(0, 0, 0, 0.12)',
    xl: '0 16px 28px rgba(0, 0, 0, 0.16)',
  },
};

// Theme X: AgendaIQ Theme
export const tasarimTheme: Theme = {
  id: 'tasarim',
  name: 'AgendaIQ',
  description: 'Official AgendaIQ dark theme with purple accents',
  colors: {
    // Map provided Tailwind hints to our tokens without breaking structure
    // Provided hints: primary #6366F1, secondary #8B5CF6, background #0F172A, surface #1E293B, muted #64748B, white #FFFFFF
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    primaryForeground: '#FFFFFF',

    secondary: '#8B5CF6',
    secondaryLight: '#A78BFA',
    secondaryDark: '#7C3AED',
    secondaryForeground: '#FFFFFF',

    // Background layers: background = page bg, card = surface, secondary/tertiary = subtle elevations
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#273449',

    card: '#1E293B',
    cardHover: '#273449',
    cardBorder: '#334155',

    text: '#FFFFFF',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    textInverse: '#0F172A',

    border: '#334155',
    borderLight: '#475569',
    borderDark: '#1F2937',

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

    sidebar: '#0F172A',
    sidebarText: '#E2E8F0',
    sidebarHover: '#1E293B',
    sidebarActive: '#6366F1',

    header: '#0F172A',
    headerText: '#FFFFFF',

    input: '#1E293B',
    inputBorder: '#334155',
    inputFocus: '#6366F1',
    inputText: '#FFFFFF',
    inputPlaceholder: '#64748B',

    buttonPrimary: '#6366F1',
    buttonPrimaryHover: '#4F46E5',
    buttonPrimaryText: '#FFFFFF',

    buttonSecondary: '#334155',
    buttonSecondaryHover: '#475569',
    buttonSecondaryText: '#FFFFFF',

    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(99, 102, 241, 0.12)',
    buttonGhostText: '#6366F1',

    overlay: 'rgba(0, 0, 0, 0.75)',
    shadow: 'rgba(0, 0, 0, 0.35)',
    scrollbar: '#1E293B',
    scrollbarThumb: '#475569',
  },
  fonts: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    secondary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, Inconsolata, "Fira Code", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.75rem',
    xxl: '2.5rem',
  },
  borderRadius: {
    // Balanced: keep existing structure, allow rounded-xl=1rem per hint
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px used for --radius mapping
    lg: '0.75rem',
    xl: '1rem',       // 16px
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)', // soft per hint
    lg: '0 10px 20px rgba(0, 0, 0, 0.12)',
    xl: '0 16px 28px rgba(0, 0, 0, 0.16)',
  },
};

// Standard Theme (Original theme before theme system)
export const standardTheme: Theme = {
  id: 'standard',
  name: 'Standard',
  description: 'Original standard theme from before the theme system',
  colors: {
    primary: '#5A82F7',  // HSL: 221.2 83.2% 53.3%
    primaryLight: '#7A9CF9',
    primaryDark: '#4A72F5',
    primaryForeground: '#FAFBFE',  // HSL: 210 40% 98%
    
    secondary: '#F5F6FA',  // HSL: 210 40% 96%
    secondaryLight: '#FFFFFF',
    secondaryDark: '#E5E7EB',
    secondaryForeground: '#030712',  // HSL: 222.2 84% 4.9%
    
    background: '#FFFFFF',  // HSL: 0 0% 100%
    backgroundSecondary: '#F5F6FA',
    backgroundTertiary: '#E5E7EB',
    
    card: '#FFFFFF',  // HSL: 0 0% 100%
    cardHover: '#FAFBFE',
    cardBorder: '#E5E9F0',  // HSL: 214.3 31.8% 91.4%
    
    text: '#030712',  // HSL: 222.2 84% 4.9%
    textSecondary: '#687788',  // HSL: 215.4 16.3% 46.9%
    textMuted: '#687788',  // HSL: 215.4 16.3% 46.9%
    textInverse: '#FAFBFE',
    
    border: '#E5E9F0',  // HSL: 214.3 31.8% 91.4%
    borderLight: '#F5F6FA',
    borderDark: '#D1D5DB',
    
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706',
    
    error: '#F56565',  // HSL: 0 84.2% 60.2%
    errorLight: '#FC8181',
    errorDark: '#E53E3E',
    
    info: '#5A82F7',  // HSL: 221.2 83.2% 53.3%
    infoLight: '#7A9CF9',
    infoDark: '#4A72F5',
    
    sidebar: '#FFFFFF',
    sidebarText: '#030712',
    sidebarHover: '#F5F6FA',
    sidebarActive: '#5A82F7',
    
    header: '#FFFFFF',
    headerText: '#030712',
    
    input: '#FFFFFF',
    inputBorder: '#E5E9F0',  // HSL: 214.3 31.8% 91.4%
    inputFocus: '#5A82F7',
    inputText: '#030712',
    inputPlaceholder: '#687788',
    
    buttonPrimary: '#5A82F7',
    buttonPrimaryHover: '#4A72F5',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#F5F6FA',
    buttonSecondaryHover: '#E5E7EB',
    buttonSecondaryText: '#030712',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(90, 130, 247, 0.1)',
    buttonGhostText: '#5A82F7',
    
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    scrollbar: '#E5E9F0',
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
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
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

// Theme 2: Classic Light
export const classicLightTheme: Theme = {
  id: 'classic-light',
  name: 'Classic Light',
  description: 'Clean and professional light theme',
  colors: {
    primary: '#2563EB',  // Deeper blue than standard
    primaryLight: '#3B82F6',
    primaryDark: '#1E40AF',
    primaryForeground: '#FFFFFF',
    
    secondary: '#7C3AED',  // Deeper purple
    secondaryLight: '#8B5CF6',
    secondaryDark: '#6D28D9',
    secondaryForeground: '#FFFFFF',
    
    background: '#FAFAFA',  // Slightly grayer than standard
    backgroundSecondary: '#F4F4F5',
    backgroundTertiary: '#E4E4E7',
    
    card: '#FFFFFF',
    cardHover: '#FAFAFA',
    cardBorder: '#D4D4D8',
    
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

// Classic Dark Theme
export const classicDarkTheme: Theme = {
  id: 'classic-dark',
  name: 'Classic Dark',
  description: 'Easy on the eyes dark theme',
  colors: {
    primary: '#60A5FA',
    primaryLight: '#93C5FD',
    primaryDark: '#3B82F6',
    primaryForeground: '#FFFFFF',
    
    secondary: '#A78BFA',
    secondaryLight: '#C4B5FD',
    secondaryDark: '#8B5CF6',
    secondaryForeground: '#FFFFFF',
    
    background: '#1A1A1A',
    backgroundSecondary: '#2A2A2A',
    backgroundTertiary: '#3A3A3A',
    
    card: '#2A2A2A',
    cardHover: '#3A3A3A',
    cardBorder: '#4A4A4A',
    
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textInverse: '#1A1A1A',
    
    border: '#4A4A4A',
    borderLight: '#5A5A5A',
    borderDark: '#3A3A3A',
    
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
    
    sidebar: '#2A2A2A',
    sidebarText: '#CBD5E1',
    sidebarHover: '#3A3A3A',
    sidebarActive: '#60A5FA',
    
    header: '#2A2A2A',
    headerText: '#F1F5F9',
    
    input: '#3A3A3A',
    inputBorder: '#4A4A4A',
    inputFocus: '#60A5FA',
    inputText: '#F1F5F9',
    inputPlaceholder: '#6B7280',
    
    buttonPrimary: '#60A5FA',
    buttonPrimaryHover: '#3B82F6',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#4A4A4A',
    buttonSecondaryHover: '#5A5A5A',
    buttonSecondaryText: '#F1F5F9',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(96, 165, 250, 0.1)',
    buttonGhostText: '#60A5FA',
    
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    scrollbar: '#3A3A3A',
    scrollbarThumb: '#6B7280',
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

// Theme 3: Dark Mode
export const darkModeTheme: Theme = {
  id: 'dark-mode',
  name: 'Dark Mode',
  description: 'Modern dark theme for reduced eye strain',
  colors: {
    primary: '#818CF8',  // Lighter indigo than midnight blue
    primaryLight: '#A5B4FC',
    primaryDark: '#6366F1',
    primaryForeground: '#FFFFFF',
    
    secondary: '#F472B6',  // Pink accent
    secondaryLight: '#F9A8D4',
    secondaryDark: '#EC4899',
    secondaryForeground: '#FFFFFF',
    
    background: '#18181B',  // Neutral dark gray
    backgroundSecondary: '#27272A',
    backgroundTertiary: '#3F3F46',
    
    card: '#27272A',
    cardHover: '#3F3F46',
    cardBorder: '#52525B',
    
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
    buttonPrimaryText: '#FFFFFF',
    
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

// Theme 4: High Contrast (WCAG AAA Compliant)
export const highContrastTheme: Theme = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Maximum contrast for accessibility - WCAG AAA compliant',
  colors: {
    primary: '#005A9C',  // Darker blue for better contrast
    primaryLight: '#0073BB',
    primaryDark: '#003D6B',
    primaryForeground: '#FFFFFF',
    
    secondary: '#FFFFFF',
    secondaryLight: '#FFFFFF',
    secondaryDark: '#F0F0F0',
    secondaryForeground: '#000000',
    
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#EBEBEB',
    
    card: '#FFFFFF',
    cardHover: '#F0F0F0',
    cardBorder: '#000000',
    
    text: '#000000',  // Pure black for maximum contrast
    textSecondary: '#1A1A1A',  // Still very dark for AAA
    textMuted: '#404040',  // Darker than before for better contrast
    textInverse: '#FFFFFF',
    
    border: '#000000',
    borderLight: '#404040',
    borderDark: '#000000',
    
    success: '#006400',  // Darker green for better contrast
    successLight: '#008000',
    successDark: '#004B00',
    
    warning: '#B87000',  // Darker orange for better contrast
    warningLight: '#D68000',
    warningDark: '#996000',
    
    error: '#CC0000',  // Darker red for better contrast
    errorLight: '#EE0000',
    errorDark: '#AA0000',
    
    info: '#0040AA',  // Darker blue for better contrast
    infoLight: '#0055CC',
    infoDark: '#003088',
    
    sidebar: '#001A33',  // Darker for better contrast
    sidebarText: '#FFFFFF',
    sidebarHover: '#002744',
    sidebarActive: '#005A9C',
    
    header: '#000000',
    headerText: '#FFFFFF',
    
    input: '#FFFFFF',
    inputBorder: '#000000',
    inputFocus: '#0040AA',
    inputText: '#000000',
    inputPlaceholder: '#595959',  // Darker for AAA compliance (7:1 ratio)
    
    buttonPrimary: '#005A9C',
    buttonPrimaryHover: '#003D6B',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#FFFFFF',
    buttonSecondaryHover: '#F0F0F0',
    buttonSecondaryText: '#000000',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(0, 0, 0, 0.1)',
    buttonGhostText: '#000000',
    
    overlay: 'rgba(0, 0, 0, 0.95)',
    shadow: 'rgba(0, 0, 0, 0.6)',
    scrollbar: '#B3B3B3',
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

// Forest Green Theme
export const forestGreenTheme: Theme = {
  id: 'forest-green',
  name: 'Forest Green',
  description: 'Natural green theme',
  colors: {
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    primaryForeground: '#FFFFFF',
    
    secondary: '#059669',
    secondaryLight: '#10B981',
    secondaryDark: '#047857',
    secondaryForeground: '#FFFFFF',
    
    background: '#F0FDF4',
    backgroundSecondary: '#DCFCE7',
    backgroundTertiary: '#BBF7D0',
    
    card: '#FFFFFF',
    cardHover: '#F0FDF4',
    cardBorder: '#86EFAC',
    
    text: '#064E3B',
    textSecondary: '#065F46',
    textMuted: '#047857',
    textInverse: '#FFFFFF',
    
    border: '#86EFAC',
    borderLight: '#BBF7D0',
    borderDark: '#4ADE80',
    
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
    
    sidebar: '#ECFDF5',
    sidebarText: '#064E3B',
    sidebarHover: '#D1FAE5',
    sidebarActive: '#10B981',
    
    header: '#FFFFFF',
    headerText: '#064E3B',
    
    input: '#FFFFFF',
    inputBorder: '#86EFAC',
    inputFocus: '#10B981',
    inputText: '#064E3B',
    inputPlaceholder: '#059669',
    
    buttonPrimary: '#10B981',
    buttonPrimaryHover: '#059669',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#86EFAC',
    buttonSecondaryHover: '#4ADE80',
    buttonSecondaryText: '#064E3B',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(16, 185, 129, 0.1)',
    buttonGhostText: '#10B981',
    
    overlay: 'rgba(6, 78, 59, 0.5)',
    shadow: 'rgba(6, 78, 59, 0.1)',
    scrollbar: '#BBF7D0',
    scrollbarThumb: '#10B981',
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
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(6, 78, 59, 0.05)',
    md: '0 4px 6px rgba(6, 78, 59, 0.1)',
    lg: '0 10px 15px rgba(6, 78, 59, 0.1)',
    xl: '0 20px 25px rgba(6, 78, 59, 0.1)',
  },
};

// Warm Orange Theme
export const warmOrangeTheme: Theme = {
  id: 'warm-orange',
  name: 'Warm Orange',
  description: 'Energetic warm theme',
  colors: {
    primary: '#FB923C',
    primaryLight: '#FDBA74',
    primaryDark: '#F97316',
    primaryForeground: '#FFFFFF',
    
    secondary: '#F97316',
    secondaryLight: '#FB923C',
    secondaryDark: '#EA580C',
    secondaryForeground: '#FFFFFF',
    
    background: '#FFF7ED',
    backgroundSecondary: '#FED7AA',
    backgroundTertiary: '#FDBA74',
    
    card: '#FFFFFF',
    cardHover: '#FFF7ED',
    cardBorder: '#FED7AA',
    
    text: '#431407',
    textSecondary: '#7C2D12',
    textMuted: '#9A3412',
    textInverse: '#FFFFFF',
    
    border: '#FED7AA',
    borderLight: '#FDBA74',
    borderDark: '#FB923C',
    
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    
    warning: '#FCD34D',
    warningLight: '#FDE68A',
    warningDark: '#F59E0B',
    
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    
    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoDark: '#2563EB',
    
    sidebar: '#FFF7ED',
    sidebarText: '#431407',
    sidebarHover: '#FED7AA',
    sidebarActive: '#FB923C',
    
    header: '#FFFFFF',
    headerText: '#431407',
    
    input: '#FFFFFF',
    inputBorder: '#FED7AA',
    inputFocus: '#FB923C',
    inputText: '#431407',
    inputPlaceholder: '#9A3412',
    
    buttonPrimary: '#FB923C',
    buttonPrimaryHover: '#F97316',
    buttonPrimaryText: '#FFFFFF',
    
    buttonSecondary: '#FED7AA',
    buttonSecondaryHover: '#FDBA74',
    buttonSecondaryText: '#431407',
    
    buttonGhost: 'transparent',
    buttonGhostHover: 'rgba(251, 146, 60, 0.1)',
    buttonGhostText: '#FB923C',
    
    overlay: 'rgba(67, 20, 7, 0.5)',
    shadow: 'rgba(67, 20, 7, 0.1)',
    scrollbar: '#FED7AA',
    scrollbarThumb: '#FB923C',
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
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(67, 20, 7, 0.05)',
    md: '0 4px 6px rgba(67, 20, 7, 0.1)',
    lg: '0 10px 15px rgba(67, 20, 7, 0.1)',
    xl: '0 20px 25px rgba(67, 20, 7, 0.1)',
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
  standardTheme,
  classicLightTheme,
  classicDarkTheme,
  midnightBlueTheme,
  forestGreenTheme,
  warmOrangeTheme,
  tasarimTheme,
  modernPurpleTheme,
  darkModeTheme,
  highContrastTheme,
  natureGreenTheme,
];

// Get theme by ID
export const getThemeById = (id: string): Theme => {
  return themes.find(theme => theme.id === id) || classicLightTheme
};

// Default theme
export const defaultTheme = classicLightTheme;

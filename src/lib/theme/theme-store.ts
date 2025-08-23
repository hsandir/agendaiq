'use client';

interface CustomTheme {
  name?: string;
  isDark?: boolean;
  colors: {
    background: string;
    text: string;
    card: string;
    primary: string;
    secondary: string;
    primaryForeground?: string;
    secondaryForeground?: string;
    backgroundSecondary: string;
    textMuted: string;
    secondaryLight?: string;
    error: string;
    border: string;
    inputBorder: string;
  };
  borderRadius?: {
    md: string;
  };
}

// Singleton store for theme state that persists across navigation
class ThemeStore {
  private static instance: ThemeStore;
  private initialized: boolean = false;
  private lastSyncTime: number = 0;
  private currentTheme: string | null = null;
  private customTheme: CustomTheme | null = null;
  
  private constructor() {}
  
  static getInstance(): ThemeStore {
    if (!ThemeStore.instance) {
      ThemeStore.instance = new ThemeStore();
    }
    return ThemeStore.instance;
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  setInitialized(value: boolean): void {
    this.initialized = value;
  }
  
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }
  
  setLastSyncTime(time: number): void {
    this.lastSyncTime = time;
  }
  
  getCurrentTheme(): string | null {
    return this.currentTheme;
  }
  
  setCurrentTheme(theme: string): void {
    this.currentTheme = theme;
  }
  
  getCustomTheme(): CustomTheme | null {
    return this.custom_theme;
  }
  
  setCustomTheme(theme: CustomTheme | null): void {
    this.custom_theme = theme;
  }
  
  needsSync(): boolean {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return !this.initialized ?? this.lastSyncTime < fiveMinutesAgo;
  }
  
  reset(): void {
    this.initialized = false;
    this.lastSyncTime = 0;
    this.currentTheme = null;
    this.custom_theme = null;
  }
}

export const themeStore = ThemeStore.getInstance();
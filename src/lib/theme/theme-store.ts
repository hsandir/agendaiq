'use client';

// Singleton store for theme state that persists across navigation
class ThemeStore {
  private static instance: ThemeStore;
  private initialized: boolean = false;
  private lastSyncTime: number = 0;
  private currentTheme: string | null = null;
  private customTheme: any = null;
  
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
  
  getCustomTheme(): any {
    return this.customTheme;
  }
  
  setCustomTheme(theme: any): void {
    this.customTheme = theme;
  }
  
  needsSync(): boolean {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return !this.initialized || this.lastSyncTime < fiveMinutesAgo;
  }
  
  reset(): void {
    this.initialized = false;
    this.lastSyncTime = 0;
    this.currentTheme = null;
    this.customTheme = null;
  }
}

export const themeStore = ThemeStore.getInstance();
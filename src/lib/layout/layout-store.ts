'use client';

// Singleton store for layout state that persists across navigation
class LayoutStore {
  private static instance: LayoutStore;
  private initialized: boolean = false;
  private lastSyncTime: number = 0;
  private currentLayout: string | null = null;
  
  private constructor() {}
  
  static getInstance(): LayoutStore {
    if (!LayoutStore.instance) {
      LayoutStore.instance = new LayoutStore();
    }
    return LayoutStore.instance;
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
  
  getCurrentLayout(): string | null {
    return this.currentLayout;
  }
  
  setCurrentLayout(layout: string): void {
    this.currentLayout = layout;
  }
  
  needsSync(): boolean {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return !this.initialized || this.lastSyncTime < fiveMinutesAgo;
  }
  
  reset(): void {
    this.initialized = false;
    this.lastSyncTime = 0;
    this.currentLayout = null;
  }
}

export const layoutStore = LayoutStore.getInstance();
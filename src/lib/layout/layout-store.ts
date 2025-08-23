'use client';

// Singleton store for layout state that persists across navigation
class LayoutStore {
  private static instance: LayoutStore;
  private initialized: boolean = false;
  private lastSyncTime: number = 0;
  private currentLayout: string | null = null;
  private sessionId: string | null = null;
  
  private constructor() {
    // Generate a session ID to track if we're in the same browser session
    if (typeof window !== 'undefined') {
      this.sessionId = sessionStorage.getItem('agendaiq-session-id');
      if (!this.sessionId) {
        this.sessionId = Date.now().toString();
        sessionStorage.setItem('agendaiq-session-id', this.sessionId);
      }
    }
  }
  
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
    // Only sync once per browser session, not per navigation
    if (this.lastSyncTime > 0) {
      return false; // Already synced this session
    }
    return true;
  }
  
  reset(): void {
    this.initialized = false;
    this.lastSyncTime = 0;
    this.currentLayout = null;
    // Clear session on reset
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('agendaiq-session-id');
    }
  }
}

export const layoutStore = LayoutStore.getInstance();
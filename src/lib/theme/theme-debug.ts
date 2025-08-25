'use client';

interface ThemeDebugInfo {
  currentTheme: string;
  localStorage: string | null;
  sessionStorage: {
    themeSynced: string | null;
    layoutSynced: string | null
  };
  mounted: boolean;
  timestamp: string
}

export function getThemeDebugInfo(): ThemeDebugInfo {
  if (typeof window === 'undefined') {
    return {
      currentTheme: 'SSR',
      localStorage: null,
      sessionStorage: { themeSynced: null, layoutSynced: null },
      mounted: false,
      timestamp: new Date().toISOString()
    };
  }

  return {
    currentTheme: document.documentElement.getAttribute('data-theme') ?? 'none',
    localStorage: localStorage.getItem('agendaiq-theme'),
    sessionStorage: {
      themeSynced: sessionStorage.getItem('agendaiq-theme-synced'),
      layoutSynced: sessionStorage.getItem('agendaiq-layout-synced'),
    },
    mounted: true,
    timestamp: new Date().toISOString()
  };
}

export function logThemeDebug(label: string) {
  if (process.env.NODE_ENV === 'development') {
    const info = getThemeDebugInfo();
    console.log(`🎨 Theme Debug [${label}]:`, {
      ...info,
      syncedAgo: {
        theme: info.sessionStorage.themeSynced 
          ? Math.round((Date.now() - parseInt(info.sessionStorage.themeSynced)) / 1000) + 's'
          : 'never',
        layout: info.sessionStorage.layoutSynced 
          ? Math.round((Date.now() - parseInt(info.sessionStorage.layoutSynced)) / 1000) + 's'
          : 'never'
      }
    });
  }
}

// Auto-log theme changes in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Monitor theme attribute changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        logThemeDebug('Theme Changed');
      }
    });
  });

  // Start observing once DOM is ready
  if (document.documentElement) {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
}
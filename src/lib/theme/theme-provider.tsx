"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { themes, Theme } from "./themes";
import { getContrastColor } from "./theme-utils";

// CustomTheme extends Theme interface for full compatibility
interface CustomTheme extends Omit<Theme, 'id' | 'name' | 'description'> {
  name?: string;
  description?: string;
  isDark?: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  isLoading: boolean;
  customTheme?: CustomTheme;
  setCustomTheme?: (theme: CustomTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Global state to persist across navigations (in-memory)
const globalThemeState = {
  currentThemeId: "standard",
  customTheme: undefined as CustomTheme | undefined,
  initialized: false,
  lastFetch: 0,
  dbSynced: false, // Track if we've synced with database this session
};

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // Use global state for initial values to prevent flash
  const [currentThemeId, setCurrentThemeId] = useState<string>(
    globalThemeState.currentThemeId,
  );
  const [customTheme, setCustomTheme] = useState<CustomTheme | undefined>(
    globalThemeState.customTheme,
  );
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize theme from localStorage ONCE on first mount
  useEffect(() => {
    setMounted(true);

    // Load from localStorage immediately - this is our source of truth
    const savedTheme = localStorage.getItem("agendaiq-theme");
    const savedCustomTheme = localStorage.getItem("agendaiq-custom-theme");

    if (savedTheme && themes.find((t) => t.id === savedTheme)) {
      globalThemeState.currentThemeId = savedTheme;
      setCurrentThemeId(savedTheme);
    }

    if (savedCustomTheme) {
      try {
        const parsed = JSON.parse(savedCustomTheme);
        globalThemeState.customTheme = parsed;
        setCustomTheme(parsed);
      } catch (e: unknown) {
        console.error("Failed to parse custom theme")
      }
    }

    // Mark as initialized
    globalThemeState.initialized = true;

    // Sync with database ONLY ONCE per application session
    // This happens in the background and doesn't block rendering
    if (!globalThemeState.dbSynced && typeof window !== "undefined") {
      globalThemeState.dbSynced = true; // Mark as synced immediately to prevent multiple calls
      
      // Check if user has a session (simple check for auth cookie)
      const hasSession = document.cookie.includes('next-auth.session-token') || 
                        document.cookie.includes('__Secure-next-auth.session-token');
      
      if (hasSession) {
        // Delayed fetch to not block initial render
        // This is fire-and-forget - we don't wait for it
        setTimeout(() => {
          fetch("/api/user/theme")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.theme && data.theme !== savedTheme) {
                // Only update if different from localStorage
                globalThemeState.currentThemeId = data.theme;
                setCurrentThemeId(data.theme);
                localStorage.setItem("agendaiq-theme", data.theme);
              }
            })
            .catch(() => {
              // Silently ignore - not critical
            });

          // Fetch custom theme if needed
          if (savedTheme === "custom" || globalThemeState.currentThemeId === "custom") {
            fetch("/api/user/custom-theme")
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (data?.customTheme) {
                  globalThemeState.customTheme = data.customTheme;
                  setCustomTheme(data.customTheme);
                  localStorage.setItem(
                    "agendaiq-custom-theme",
                    JSON.stringify(data.customTheme),
                  );
                }
              })
              .catch(() => {
                // Silently ignore
              });
          }
        }, 5000); // 5 second delay to ensure page is fully loaded and avoid navigation flicker
      }
    }
  }, []); // Empty deps - only run once

  // Apply theme to CSS variables - ONLY on client side to prevent hydration mismatch
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    // Get current theme object
    const theme = currentThemeId === "custom" && customTheme
      ? ({
          id: "custom",
          name: customTheme.name || "Custom Theme",
          description: "Your personalized theme",
          ...customTheme,
        } satisfies Theme)
      : themes.find((t) => t.id === currentThemeId) || themes[0];

    const root = document.documentElement;
    
    // Helper function to convert hex to HSL for CSS variables
    const hexToHslVar = (hex: string): string => {
      // Remove # if present
      hex = hex.replace('#', '');
      
      // Convert hex to RGB
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let hDeg = 0;
      let s = 0;
      const l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r:
            hDeg = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            hDeg = (b - r) / d + 2;
            break;
          case b:
            hDeg = (r - g) / d + 4;
            break;
        }
        hDeg /= 6;
      }
      const hNum = Math.round(hDeg * 360);
      const sNum = Math.round(s * 100);
      const lNum = Math.round(l * 100);
      return `${hNum} ${sNum}% ${lNum}%`;
    };

    // Apply color variables with proper formatting
    const setVar = (name: string, valueHex: string) => {
      try {
        const hslValue = hexToHslVar(valueHex);
        const currentValue = root.style.getPropertyValue(`--${name}`);
        // Only update if value changed to prevent unnecessary repaints
        if (currentValue !== hslValue) {
          root.style.setProperty(`--${name}`, hslValue);
        }
      } catch (err: unknown) {
        console.error(`Failed to set CSS variable --${name}:`, err);
      }
    };

    setVar("background", theme.colors.background);
    setVar("foreground", theme.colors.text);
    setVar("card", theme.colors.card);
    setVar("card-foreground", theme.colors.text);
    setVar("popover", theme.colors.card);
    setVar("popover-foreground", theme.colors.text);
    setVar("primary", theme.colors.primary);
    setVar(
      "primary-foreground",
      theme.colors.primaryForeground ?? getContrastColor(theme.colors.primary),
    );
    setVar("secondary", theme.colors.secondary);
    setVar(
      "secondary-foreground",
      theme.colors.secondaryForeground ?? getContrastColor(theme.colors.secondary),
    );
    setVar("muted", theme.colors.backgroundSecondary);
    setVar("muted-foreground", theme.colors.textMuted);
    setVar("accent", theme.colors.secondaryLight ?? theme.colors.secondary);
    setVar(
      "accent-foreground",
      theme.colors.secondaryForeground ?? getContrastColor(theme.colors.secondary),
    );
    setVar("destructive", theme.colors.error);
    setVar("destructive-foreground", getContrastColor(theme.colors.error));
    setVar("border", theme.colors.border);
    setVar("input", theme.colors.inputBorder);
    setVar("ring", theme.colors.primary);

    // Apply other theme properties
    if (theme.borderRadius?.md)
      root.style.setProperty("--radius", theme.borderRadius.md);

    // Update body class for theme
    document.body.className = `theme-${currentThemeId}`;

    // Apply theme class for Tailwind dark mode support
    document.documentElement.classList.remove("light", "dark");
    if (
      theme.id === "dark-mode" ||
      theme.id === "modern-purple" ||
      theme.id === "high-contrast" ||
      theme.id === "tasarim" ||
      theme.id === "midnight-blue" ||
      theme.id === "classic-dark"
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [mounted, currentThemeId, customTheme]);

  // Handle theme change - ONLY update database when user explicitly changes theme
  const handleSetTheme = useCallback(
    (themeId: string) => {
      if (themeId === currentThemeId) return; // No change needed

      // Update local state immediately
      setCurrentThemeId(themeId);
      globalThemeState.currentThemeId = themeId;
      localStorage.setItem("agendaiq-theme", themeId);

      // Update database in background (fire and forget)
      setIsLoading(true);
      fetch("/api/user/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeId }),
      })
        .catch(() => {
          // Silently fail - localStorage is source of truth
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [currentThemeId],
  );

  // Handle custom theme update
  const handleSetCustomTheme = useCallback((theme: CustomTheme) => {
    setCustomTheme(theme);
    globalThemeState.customTheme = theme;
    localStorage.setItem("agendaiq-custom-theme", JSON.stringify(theme));

    // Save to database in background
    fetch("/api/user/custom-theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customTheme: theme }),
    }).catch(() => {
      // Silently fail
    });
  }, []);

  // Get current theme object
  const currentTheme =
    currentThemeId === "custom" && customTheme
      ? ({
          id: "custom",
          name: customTheme.name || "Custom Theme",
          description: "Your personalized theme",
          ...customTheme,
        } satisfies Theme)
      : themes.find((t) => t.id === currentThemeId) || themes[0];

  // Always render children, but apply theme styles only when mounted
  const contextValue = {
    theme: mounted ? currentTheme : themes[0], // Use current theme if mounted, default otherwise
    setTheme: handleSetTheme,
    availableThemes: themes,
    isLoading,
    customTheme: mounted ? customTheme : undefined,
    setCustomTheme: handleSetCustomTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

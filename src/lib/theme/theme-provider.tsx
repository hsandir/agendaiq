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

interface ThemeContextValue {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  isLoading: boolean;
  customTheme?: CustomTheme;
  setCustomTheme?: (theme: CustomTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Global state to persist across navigations (in-memory)
const globalThemeState = {
  currentThemeId: "standard",
  customTheme: undefined as CustomTheme | undefined,
  initialized: false,
  lastFetch: 0,
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

    // Only initialize once per app lifecycle
    if (!globalThemeState.initialized) {
      globalThemeState.initialized = true;

      // Load from localStorage
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
          console.error("Failed to parse custom theme");
        }
      }

      // Fetch from database ONCE after initial load (if user is logged in)
      // Only if we haven't fetched in the last 5 minutes
      if (typeof window !== "undefined") {
        const now = Date.now();
        if (now - globalThemeState.lastFetch > 5 * 60 * 1000) {
          globalThemeState.lastFetch = now;

          // Delayed fetch to not block initial render
          setTimeout(() => {
            fetch("/api/user/theme")
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (
                  data?.theme &&
                  data.theme !== globalThemeState.currentThemeId
                ) {
                  globalThemeState.currentThemeId = data.theme;
                  setCurrentThemeId(data.theme);
                  localStorage.setItem("agendaiq-theme", data.theme);
                }
              })
              .catch(() => {
                // Silently ignore - user might not be logged in
              });

            // Fetch custom theme if needed
            if (globalThemeState.currentThemeId === "custom") {
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
          }, 1000); // 1 second delay to not interfere with initial page load
        }
      }
    } else {
      // Already initialized, just use global state
      setCurrentThemeId(globalThemeState.currentThemeId);
      setCustomTheme(globalThemeState.customTheme);
    }
  }, []); // Empty deps - only run once

  // Apply theme CSS variables
  useEffect(() => {
    if (!mounted) return;

    let theme: Theme;

    if (currentThemeId === "custom" && customTheme) {
      theme = {
        id: "custom",
        name: customTheme.name || "Custom Theme",
        description: "Your personalized theme",
        ...customTheme,
      } satisfies Theme;
    } else {
      theme = themes.find((t) => t.id === currentThemeId) || themes[0];
    }

    // Apply CSS variables
    const root = document.documentElement;

    // Helper to convert hex to HSL format that Tailwind expects
    const hexToHslVar = (hex: string): string => {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16) / 255;
      const g = parseInt(h.substring(2, 4), 16) / 255;
      const b = parseInt(h.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
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
        root.style.setProperty(`--${name}`, hslValue);
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

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: themes[0], // Default theme for SSR
          setTheme: () => {},
          availableThemes: themes,
          isLoading: false,
          customTheme: undefined,
          setCustomTheme: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme: handleSetTheme,
        availableThemes: themes,
        isLoading,
        customTheme,
        setCustomTheme: handleSetCustomTheme,
      }}
    >
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

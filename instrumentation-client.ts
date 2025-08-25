import posthog from "posthog-js";

// Initialize PostHog on the client
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      person_profiles: 'identified_only',
      capture_pageleave: true,
      capture_pageview: false, // We handle this manually in PostHogProvider
      autocapture: process.env.NODE_ENV === "production",
      capture_heatmaps: process.env.NODE_ENV === "production",
      capture_performance: process.env.NODE_ENV === "production",
      capture_dead_clicks: process.env.NODE_ENV === "production",
      session_recording: {
        maskAllInputs: true,
      },
      debug: false, // Disable debug to reduce console noise
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          console.log("PostHog loaded successfully");
        }
      }
    });
  } catch (error) {
    console.warn("PostHog initialization failed:", error);
  }
} else {
  console.warn("PostHog key not found, analytics disabled");
}

// Export for compatibility
export const onRouterTransitionStart = () => {
  // No-op function for compatibility with old Sentry setup
};
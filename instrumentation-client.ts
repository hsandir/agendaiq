import posthog from "posthog-js";

// Initialize PostHog on the client
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    person_profiles: 'identified_only', // Updated from 'defaults'
    capture_pageleave: true,
    capture_pageview: false, // We handle this manually in PostHogProvider
    autocapture: true,
    capture_heatmaps: true,
    capture_performance: true,
    capture_console_errors: true, // Capture console errors
    capture_dead_clicks: true,
    session_recording: {
      maskAllInputs: true,
      maskTextContent: false,
    },
    debug: process.env.NODE_ENV === "development",
  });
}

// Export for compatibility
export const onRouterTransitionStart = () => {
  // No-op function for compatibility with old Sentry setup
};
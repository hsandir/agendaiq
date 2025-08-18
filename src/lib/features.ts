/**
 * Feature Flag System for v2 Development
 * This keeps v2 features isolated from production
 */

/**
 * Check if Team v2 feature is enabled
 * Only enabled in development with explicit flag
 */
export const isTeamV2Enabled = (): boolean => {
  // Safety check: NEVER enable in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // Only enable if explicitly set to 'true'
  return process.env.NEXT_PUBLIC_ENABLE_TEAM_V2 === 'true';
};

/**
 * Hook for client components
 */
export const useTeamV2 = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return isTeamV2Enabled();
};

/**
 * Feature flags for future v2 features
 */
export const FEATURES = {
  TEAM_V2: isTeamV2Enabled(),
  TEAM_V2_ANALYTICS: false, // Phase 2
  TEAM_V2_AI: false, // Phase 3
} as const;
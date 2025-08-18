/**
 * Feature flags for controlling feature visibility
 * This allows us to develop features in isolation without affecting production
 */

/**
 * Check if Team System v2 is enabled
 * Only enabled in development when feature flag is set
 */
export const isTeamV2Enabled = (): boolean => {
  // Disable in production completely
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // Check feature flag in development
  return process.env.NEXT_PUBLIC_ENABLE_TEAM_V2 === 'true';
};

/**
 * Check if development features are enabled
 */
export const isDevelopmentMode = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if monitoring features are enabled
 */
export const isMonitoringEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true';
};

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEBUG === 'true';
};

/**
 * Get feature flags status
 */
export const getFeatureFlags = () => {
  return {
    teamV2: isTeamV2Enabled(),
    development: isDevelopmentMode(),
    monitoring: isMonitoringEnabled(),
    debug: isDebugMode(),
  };
};
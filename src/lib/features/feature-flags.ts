/**
 * Feature Flag System for Safe Progressive Enhancement
 * 
 * This system allows us to deploy incomplete features safely
 * without breaking production deployments.
 */

// Feature flags from environment variables
export const FEATURES = {
  TEAMS: {
    // Main feature toggle
    enabled: process.env.NEXT_PUBLIC_FEATURE_TEAMS === 'true',
    
    // Sub-feature toggles for gradual rollout
    phases: {
      PHASE_1_BASIC: process.env.NEXT_PUBLIC_TEAMS_PHASE_1 === 'true',
      PHASE_2_MEETINGS: process.env.NEXT_PUBLIC_TEAMS_PHASE_2 === 'true',
      PHASE_3_KNOWLEDGE: process.env.NEXT_PUBLIC_TEAMS_PHASE_3 === 'true',
      PHASE_4_ADVANCED: process.env.NEXT_PUBLIC_TEAMS_PHASE_4 === 'true',
    },
    
    // Configuration
    config: {
      maxTeamsPerUser: parseInt(process.env.NEXT_PUBLIC_MAX_TEAMS_PER_USER || '10'),
      maxMembersPerTeam: parseInt(process.env.NEXT_PUBLIC_MAX_MEMBERS_PER_TEAM || '50'),
      enableAnalytics: process.env.NEXT_PUBLIC_TEAMS_ANALYTICS === 'true',
    }
  },
  
  // Future features can be added here
  // FEATURE_X: {
  //   enabled: process.env.NEXT_PUBLIC_FEATURE_X === 'true'
  // }
} as const;

// Type-safe feature checking
export type FeatureName = keyof typeof FEATURES;

// Helper functions
export function isFeatureEnabled(feature: FeatureName): boolean {
  return FEATURES[feature]?.enabled || false;
}

export function getFeatureConfig<T extends FeatureName>(feature: T): typeof FEATURES[T] {
  return FEATURES[feature];
}

// Development helper to show feature status
export function getFeatureStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  
  Object.entries(FEATURES).forEach(([key, value]) => {
    status[key] = value.enabled;
    if (value.phases) {
      Object.entries(value.phases).forEach(([phase, enabled]) => {
        status[`${key}.${phase}`] = enabled as boolean;
      });
    }
  });
  
  return status;
}

// Check if we're in development mode
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Log feature status in development
if (isDevelopment) {
  console.log('🚀 Feature Flags Status:', getFeatureStatus());
}
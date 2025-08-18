'use client';

import { useState, useEffect } from 'react';

// REQUIRED: Import proper types from @prisma/client or your type files
// import type { ... } from '@prisma/client';
// import type { ... } from '@/types/...';

// REQUIRED: Define proper interfaces for props - NEVER use Record<string, unknown>
interface COMPONENT_NAMEProps {
  // Add properly typed props here
  // Example: user: AuthUser;
  // Example: data: MeetingWithRelations;
}

export function COMPONENT_NAME({ /* destructure props */ }: COMPONENT_NAMEProps) {
  // State with proper types
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    // Component logic
  }, []);

  // Event handlers
  const handleAction = async () => {
    setLoading(true);
    try {
      // Action logic
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Component content */}
    </div>
  );
}

// RULES:
// 1. NEVER use Record<string, unknown> - always define proper types
// 2. Import types from @prisma/client or your type files
// 3. Use type assertions sparingly - prefer proper typing
// 4. Handle loading and error states properly
// 5. Use English for all UI text and comments
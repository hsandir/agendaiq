'use client'

import { AuthenticatedUser } from '@/lib/auth/auth-utils'

interface HealthClientProps {
  user: AuthenticatedUser
}

export default function HealthClient({ user }: HealthClientProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Health Check</h1>
          <p className="text-muted-foreground">Monitor page performance and detect errors across the application</p>
        </div>
      </div>
      <div className="bg-card rounded-lg p-6">
        <p className="text-muted-foreground">
          Health check functionality will be implemented in the client component.
          Current user: {user.name} ({user.email})
        </p>
      </div>
    </div>
  )
}
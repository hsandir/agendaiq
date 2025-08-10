/**
 * CI/CD Pipeline Monitoring Page
 * Following CLAUDE.md rules for real-time data and no mock data
 */

import { Suspense } from 'react';
import { CICDMonitor } from '@/components/monitoring/CICDMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { requireAuth } from '@/lib/auth/auth-utils';
import { Capability } from '@/lib/auth/policy';

export default async function CICDMonitoringPage() {
  // Require CI/CD monitoring capability
  await requireAuth({ requireAuth: true, requireCapability: Capability.DEV_CI });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CI/CD Pipeline Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring of build, test, and deployment pipelines
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingState />}>
        <CICDMonitor />
      </Suspense>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Build Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
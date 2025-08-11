import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import PerformanceMonitor from '@/components/development/performance-monitor';

export default async function PerformancePage() {
  const user = await requireAuth(AuthPresets.requireDevelopment);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-foreground">Performance Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time performance metrics and system monitoring
        </p>
      </div>
      
      <PerformanceMonitor />
    </div>
  );
}
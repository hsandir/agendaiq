"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import LocalMonitor from '@/components/monitoring/local-monitor';
import ProductionMonitor from '@/components/monitoring/production-monitor';
import EnhancedLiveMonitor from '@/components/monitoring/enhanced-live-monitor';
import CICDMonitor from '@/components/development/ci-cd-monitor';
import PostHogAnalytics from '@/components/monitoring/PostHogAnalytics';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';

interface MonitoringClientProps {
  user: _AuthenticatedUser
}

export default function MonitoringClient({ user }: MonitoringClientProps) {
  const [activeTab, setActiveTab] = useState("posthog");

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Professional Error Monitoring System</h1>
            <p className="text-muted-foreground mt-2">
              Advanced error analysis with automated solution recommendations - Detailed view of error types per page
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {user.name} - OPS
          </Badge>
        </div>
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-full w-3 h-3 mt-2 flex-shrink-0 animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                🚀 AI-Powered Professional Monitoring System
              </p>
              <p className="text-xs text-blue-700 mt-1">
                This system analyzes every error in detail, explains what kind of issues exist on which page, 
                provides solution recommendations and preventive measures. Catches all problems before deployment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="posthog">PostHog Analytics</TabsTrigger>
          <TabsTrigger value="enhanced">Professional Logging</TabsTrigger>
          <TabsTrigger value="local">Local Monitoring</TabsTrigger>
          <TabsTrigger value="production">Production Monitoring</TabsTrigger>
          <TabsTrigger value="cicd">CI/CD Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="posthog">
          <PostHogAnalytics />
        </TabsContent>

        <TabsContent value="enhanced">
          <EnhancedLiveMonitor showDevLogs={true} showAuditLogs={true} />
        </TabsContent>

        <TabsContent value="local">
          <LocalMonitor />
        </TabsContent>

        <TabsContent value="production">
          <ProductionMonitor />
        </TabsContent>

        <TabsContent value="cicd">
          <CICDMonitor />
        </TabsContent>
      </Tabs>
      
      {/* Advanced Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">🔍 Advanced Analysis</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Detailed categorization for every error</li>
            <li>• Priority score and estimated fix time</li>
            <li>• Page-specific error localization</li>
            <li>• Automatic impact analysis and risk assessment</li>
          </ul>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">🛠️ Smart Solutions</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Local: Browser errors, console warnings, performance issues</li>
            <li>• Production: Deployment status, server errors, uptime monitoring</li>
            <li>• AI-powered solution recommendations for both environments</li>
            <li>• Separate monitoring with environment-specific analysis</li>
          </ul>
        </div>

        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2">📊 Environment Separation</h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Local: Real-time JavaScript error detection</li>
            <li>• Production: Admin-only deployment monitoring</li>
            <li>• Isolated error tracking per environment</li>
            <li>• Comprehensive debugging before deployment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
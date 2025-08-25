'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, Construction } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary for feature components
 * Prevents feature errors from breaking the entire app
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Feature error in ${(this.props as Record<string, unknown>).feature}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if ((this.props as Record<string, unknown>).fallback) {
        return <>{(this.props as Record<string, unknown>).fallback}</>;
      }
      
      return <FeatureError feature={(this.props as Record<string, unknown>).feature} error={this.state.error} />;
    }

    return (this.props as Record<string, unknown>).children;
  }
}

/**
 * Coming Soon component for features in development
 */
export function FeatureComingSoon({ 
  feature, 
  description 
}: { 
  feature: string;
  description?: string;
}) {
  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Construction className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle>{feature} - Coming Soon</CardTitle>
        <CardDescription>
          {description || 'This feature is currently under development and will be available soon.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          We're working hard to bring you this feature. Check back later!
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Error display component for feature failures
 */
export function FeatureError({ 
  feature, 
  error,
  onRetry 
}: { 
  feature: string;
  error?: Error;
  onRetry?: () => void;
}) {
  return (
    <Card className="max-w-2xl mx-auto mt-8 border-destructive/50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <CardTitle>{feature} - Temporarily Unavailable</CardTitle>
        <CardDescription>
          We're experiencing some issues with this feature.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Please try again later or contact support if the problem persists.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-medium">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {error.stack || error.message}
            </pre>
          </details>
        )}
        
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading component for async features
 */
export function FeatureLoading({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-4 text-sm text-muted-foreground">Loading {feature}...</p>
    </div>
  );
}

/**
 * Safe feature wrapper component
 * Use this to wrap any feature that might fail
 */
export function SafeFeature({
  feature,
  enabled,
  children,
  comingSoonMessage,
  loadingMessage
}: {
  feature: string;
  enabled: boolean;
  children: ReactNode;
  comingSoonMessage?: string;
  loadingMessage?: string;
}) {
  if (!enabled) {
    return <FeatureComingSoon feature={feature} description={comingSoonMessage} />;
  }

  return (
    <FeatureErrorBoundary feature={feature}>
      {children}
    </FeatureErrorBoundary>
  );
}
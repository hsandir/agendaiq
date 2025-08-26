"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Settings,
  Database,
  Shield,
  Mail,
  Chrome
} from 'lucide-react';

interface ValidationReport {
  environment: string;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    trailingNewlines: string[];
    malformedUrls: string[];
    missingSecrets: string[];
  };
  config: {
    hasDatabase: boolean;
    hasAuth: boolean;
    hasEmail: boolean;
    hasGoogleAuth: boolean;
  };
  suggestions: string[];
}

export function EnvironmentValidator() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/env/validate');
      const data = await response.json();
      
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || 'Failed to fetch environment report');
      }
    } catch (err) {
      setError('Failed to connect to validation API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getStatusIcon = (isValid: boolean, hasWarnings: boolean) => {
    if (!isValid) return <XCircle className="h-5 w-5 text-destructive" />;
    if (hasWarnings) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusColor = (isValid: boolean, hasWarnings: boolean) => {
    if (!isValid) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (hasWarnings) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Validator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Validating environment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Validator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-destructive/20 bg-destructive/10">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchReport} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  const { validation, config } = report;
  const hasWarnings = validation.warnings.length > 0;

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Environment Validator
            </CardTitle>
            <Button onClick={fetchReport} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusColor(validation.isValid, hasWarnings)}`}>
              {getStatusIcon(validation.isValid, hasWarnings)}
              <div>
                <div className="font-medium">
                  {validation.isValid 
                    ? hasWarnings ? 'Valid with Warnings' : 'Environment Valid'
                    : 'Environment Issues Detected'
                  }
                </div>
                <div className="text-sm opacity-80">
                  Environment: {report.environment}
                </div>
              </div>
            </div>

            {/* Service Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Database className={`h-4 w-4 ${config.hasDatabase ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <div className="text-sm font-medium">Database</div>
                  <Badge variant={config.hasDatabase ? 'default' : 'secondary'} className="text-xs">
                    {config.hasDatabase ? 'Connected' : 'Missing'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Shield className={`h-4 w-4 ${config.hasAuth ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <div className="text-sm font-medium">Auth</div>
                  <Badge variant={config.hasAuth ? 'default' : 'secondary'} className="text-xs">
                    {config.hasAuth ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Mail className={`h-4 w-4 ${config.hasEmail ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <Badge variant={config.hasEmail ? 'default' : 'secondary'} className="text-xs">
                    {config.hasEmail ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Chrome className={`h-4 w-4 ${config.hasGoogleAuth ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <div className="text-sm font-medium">Google</div>
                  <Badge variant={config.hasGoogleAuth ? 'default' : 'secondary'} className="text-xs">
                    {config.hasGoogleAuth ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {validation.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <Alert key={index} className="border-destructive/20 bg-destructive/10">
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.warnings.map((warning, index) => (
                <Alert key={index} className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-800">
                    {warning}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {report.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="text-sm">{suggestion}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
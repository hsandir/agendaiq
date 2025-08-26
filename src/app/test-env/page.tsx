"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

export default function TestEnvironmentPage() {
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
      
      // Fallback: Test environment variables client-side
      console.log('Client-side environment test:');
      console.log('NEXT_PUBLIC_* variables are:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Test environment validation manually
  const testManual = () => {
    console.log('Manual Environment Test:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // These will be undefined in client-side, but should show in console
    const envVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET', 
      'DATABASE_URL',
      'GOOGLE_CLIENT_ID'
    ];
    
    envVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`${varName}:`, value ? 'SET' : 'undefined');
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Environment Validation System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? 'Testing...' : 'Test API Endpoint'}
            </Button>
            <Button onClick={testManual} variant="outline">
              Test Manual
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive font-medium">Error:</p>
              <p className="text-destructive">{error}</p>
            </div>
          )}
          
          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Environment Status</h3>
                  <Badge variant={report.validation.isValid ? 'default' : 'destructive'}>
                    {report.validation.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Environment: {report.environment}
                  </p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Services</h3>
                  <div className="space-y-1 text-sm">
                    <div>Database: {report.config.hasDatabase ? '✅' : '❌'}</div>
                    <div>Auth: {report.config.hasAuth ? '✅' : '❌'}</div>
                    <div>Email: {report.config.hasEmail ? '✅' : '❌'}</div>
                    <div>Google: {report.config.hasGoogleAuth ? '✅' : '❌'}</div>
                  </div>
                </div>
              </div>
              
              {report.validation.errors.length > 0 && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="font-medium text-destructive mb-2">Errors</h3>
                  <ul className="text-sm text-destructive space-y-1">
                    {report.validation.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {report.validation.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2">Warnings</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {report.validation.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {report.suggestions.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Suggestions</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {report.suggestions.map((suggestion, i) => (
                      <li key={i}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
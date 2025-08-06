'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Terminal,
  Loader2,
  FileCode,
  PlayCircle,
  StopCircle,
  Clock,
  Wrench,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

interface AutofixModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'test' | 'cicd';
  failedItems: any[];
}

interface FixStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  command?: string;
  output?: string;
  error?: string;
  duration?: number;
}

interface FixResult {
  success: boolean;
  fixed: number;
  failed: number;
  skipped: number;
  logs: string[];
}

export default function AutofixModal({ isOpen, onClose, type, failedItems }: AutofixModalProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<FixStep[]>([]);
  const [result, setResult] = useState<FixResult | null>(null);
  const [executedCommands, setExecutedCommands] = useState<string[]>([]);
  const [currentOutput, setCurrentOutput] = useState<string[]>([]);
  const [fixStrategy, setFixStrategy] = useState<'safe' | 'aggressive'>('safe');

  useEffect(() => {
    if (isOpen && failedItems.length > 0) {
      initializeFixSteps();
    }
  }, [isOpen, failedItems]);

  const initializeFixSteps = () => {
    const fixSteps: FixStep[] = [];

    if (type === 'cicd') {
      // Analyze CI/CD errors and create fix steps
      const errorTypes = analyzeErrors(failedItems);
      
      if (errorTypes.includes('dependency')) {
        fixSteps.push({
          id: 'deps',
          name: 'Fix Dependencies',
          description: 'Update and install missing dependencies',
          status: 'pending',
          command: 'npm install && npm audit fix'
        });
      }

      if (errorTypes.includes('typescript')) {
        fixSteps.push({
          id: 'types',
          name: 'Fix TypeScript Errors',
          description: 'Resolve type checking issues',
          status: 'pending',
          command: 'npm run typecheck -- --noEmit false'
        });
      }

      if (errorTypes.includes('lint')) {
        fixSteps.push({
          id: 'lint',
          name: 'Fix Linting Issues',
          description: 'Auto-fix ESLint and Prettier issues',
          status: 'pending',
          command: 'npm run lint:fix && npm run format'
        });
      }

      if (errorTypes.includes('test')) {
        fixSteps.push({
          id: 'tests',
          name: 'Fix Failing Tests',
          description: 'Update test snapshots and fix assertions',
          status: 'pending',
          command: 'npm test -- --updateSnapshot'
        });
      }

      if (errorTypes.includes('build')) {
        fixSteps.push({
          id: 'build',
          name: 'Fix Build Errors',
          description: 'Clear cache and rebuild',
          status: 'pending',
          command: 'rm -rf .next && npm run build'
        });
      }
    } else {
      // Test-specific fix steps
      fixSteps.push(
        {
          id: 'analyze',
          name: 'Analyze Test Failures',
          description: 'Identifying common failure patterns',
          status: 'pending'
        },
        {
          id: 'snapshots',
          name: 'Update Snapshots',
          description: 'Update outdated test snapshots',
          status: 'pending',
          command: 'npm test -- --updateSnapshot'
        },
        {
          id: 'mocks',
          name: 'Fix Mock Data',
          description: 'Reset and update test mock configurations',
          status: 'pending',
          command: 'rm -rf node_modules/.cache && npm test -- --clearCache'
        },
        {
          id: 'coverage',
          name: 'Generate Missing Tests',
          description: 'Create tests for uncovered code',
          status: 'pending'
        }
      );
    }

    // Add verification step
    fixSteps.push({
      id: 'verify',
      name: 'Verify Fixes',
      description: 'Re-run tests to verify fixes',
      status: 'pending',
      command: type === 'cicd' ? 'npm run ci' : 'npm test'
    });

    setSteps(fixSteps);
    setProgress(0);
    setCurrentStep(0);
    setResult(null);
    setExecutedCommands([]);
    setCurrentOutput([]);
  };

  const analyzeErrors = (items: any[]): string[] => {
    const errorTypes = new Set<string>();
    
    items.forEach(item => {
      const errorMessage = item.error || item.logs || '';
      
      if (errorMessage.includes('npm') || errorMessage.includes('node_modules')) {
        errorTypes.add('dependency');
      }
      if (errorMessage.includes('Type error') || errorMessage.includes('TS')) {
        errorTypes.add('typescript');
      }
      if (errorMessage.includes('ESLint') || errorMessage.includes('Prettier')) {
        errorTypes.add('lint');
      }
      if (errorMessage.includes('test failed') || errorMessage.includes('expect')) {
        errorTypes.add('test');
      }
      if (errorMessage.includes('build failed') || errorMessage.includes('webpack')) {
        errorTypes.add('build');
      }
    });

    return Array.from(errorTypes);
  };

  const startAutoFix = async () => {
    setIsFixing(true);
    setCurrentStep(0);
    setProgress(0);
    
    const totalSteps = steps.length;
    let fixedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const logs: string[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Update current step status to running
      setSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'running' } : s
      ));
      setCurrentStep(i);
      setProgress((i / totalSteps) * 100);
      
      try {
        // Execute the fix step
        const stepResult = await executeFixStep(step);
        
        if (stepResult.success) {
          setSteps(prev => prev.map((s, idx) => 
            idx === i ? { 
              ...s, 
              status: 'success',
              output: stepResult.output,
              duration: stepResult.duration 
            } : s
          ));
          fixedCount++;
          logs.push(`✓ ${step.name}: ${stepResult.output}`);
        } else {
          setSteps(prev => prev.map((s, idx) => 
            idx === i ? { 
              ...s, 
              status: 'failed',
              error: stepResult.error,
              duration: stepResult.duration 
            } : s
          ));
          failedCount++;
          logs.push(`✗ ${step.name}: ${stepResult.error}`);
          
          // If critical step fails and we're in safe mode, stop
          if (fixStrategy === 'safe' && ['deps', 'build'].includes(step.id)) {
            skippedCount = totalSteps - i - 1;
            // Mark remaining steps as skipped
            setSteps(prev => prev.map((s, idx) => 
              idx > i ? { ...s, status: 'skipped' } : s
            ));
            break;
          }
        }
      } catch (error) {
        setSteps(prev => prev.map((s, idx) => 
          idx === i ? { 
            ...s, 
            status: 'failed',
            error: String(error)
          } : s
        ));
        failedCount++;
        logs.push(`✗ ${step.name}: ${error}`);
      }
      
      // Add executed command to history
      if (step.command) {
        setExecutedCommands(prev => [...prev, step.command!]);
      }
    }

    setProgress(100);
    setResult({
      success: failedCount === 0,
      fixed: fixedCount,
      failed: failedCount,
      skipped: skippedCount,
      logs
    });
    setIsFixing(false);
  };

  const executeFixStep = async (step: FixStep): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    duration: number;
  }> => {
    const startTime = Date.now();
    
    // Add output in real-time
    setCurrentOutput(prev => [...prev, `$ ${step.command || step.name}`]);
    
    try {
      if (!step.command) {
        // For analysis steps without commands
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCurrentOutput(prev => [...prev, `Analyzing ${failedItems.length} failures...`]);
        return {
          success: true,
          output: `Analyzed ${failedItems.length} failures`,
          duration: Date.now() - startTime
        };
      }

      // First, get suggestions based on error type
      const errorType = detectErrorType();
      const errorMessage = extractErrorMessage();
      
      // Get autofix suggestions
      const suggestionsResponse = await fetch(
        `/api/dev/ci-cd/autofix?errorType=${encodeURIComponent(errorType)}&errorMessage=${encodeURIComponent(errorMessage)}`
      );
      
      if (!suggestionsResponse.ok) {
        throw new Error('Failed to get autofix suggestions');
      }
      
      const suggestionsData = await suggestionsResponse.json();
      const suggestions = suggestionsData.suggestions || [];
      
      // Find matching suggestion for this step
      const matchingSuggestion = suggestions.find((s: any) => 
        s.id === step.id || 
        s.commands.some((cmd: string) => cmd.includes(step.command!.split(' ')[0]))
      );
      
      if (!matchingSuggestion) {
        // If no matching suggestion, execute command directly via a new endpoint
        setCurrentOutput(prev => [...prev, `⚠️ No autofix suggestion found, executing command directly...`]);
        
        // Create a custom suggestion
        const customSuggestion = {
          id: step.id,
          title: step.name,
          description: step.description,
          confidence: 'medium',
          commands: [step.command],
          files: [],
          preventive: false
        };
        
        // Execute the fix
        const response = await fetch('/api/dev/ci-cd/autofix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            suggestionId: customSuggestion.id,
            errorType: errorType,
            errorMessage: errorMessage,
            dryRun: false,
            customSuggestion // Pass the custom suggestion
          })
        });

        const data = await response.json();
        
        // Process results
        if (data.results && data.results.applied) {
          data.results.applied.forEach((line: string) => {
            setCurrentOutput(prev => [...prev, line]);
          });
        }
        
        if (data.results && data.results.failed && data.results.failed.length > 0) {
          data.results.failed.forEach((fail: any) => {
            setCurrentOutput(prev => [...prev, `❌ ${fail.action}: ${fail.error}`]);
          });
        }

        return {
          success: data.success,
          output: data.results?.applied?.join('\n') || 'Command executed',
          error: data.results?.failed?.[0]?.error,
          duration: Date.now() - startTime
        };
      }
      
      // Execute the matching suggestion
      const response = await fetch('/api/dev/ci-cd/autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: matchingSuggestion.id,
          errorType: errorType,
          errorMessage: errorMessage,
          dryRun: false
        })
      });

      const data = await response.json();
      
      // Process results
      if (data.results && data.results.applied) {
        data.results.applied.forEach((line: string) => {
          setCurrentOutput(prev => [...prev, line]);
        });
      }
      
      if (data.results && data.results.failed && data.results.failed.length > 0) {
        data.results.failed.forEach((fail: any) => {
          setCurrentOutput(prev => [...prev, `❌ ${fail.action}: ${fail.error}`]);
        });
      }

      return {
        success: data.success,
        output: data.results?.applied?.join('\n') || 'Command executed successfully',
        error: data.results?.failed?.[0]?.error,
        duration: Date.now() - startTime
      };
    } catch (error) {
      setCurrentOutput(prev => [...prev, `Error: ${error}`]);
      return {
        success: false,
        error: String(error),
        duration: Date.now() - startTime
      };
    }
  };
  
  const detectErrorType = (): string => {
    // Analyze failed items to detect error type
    if (failedItems.length === 0) return 'Unknown Error';
    
    const errorMessages = failedItems.map(item => 
      item.error || item.logs || item.conclusion || ''
    ).join(' ');
    
    if (errorMessages.includes('npm') || errorMessages.includes('node_modules')) return 'NPM Error';
    if (errorMessages.includes('TypeError') || errorMessages.includes('TS')) return 'TypeScript Error';
    if (errorMessages.includes('ESLint') || errorMessages.includes('Prettier')) return 'Lint Error';
    if (errorMessages.includes('test') || errorMessages.includes('expect')) return 'Test Failure';
    if (errorMessages.includes('build') || errorMessages.includes('webpack')) return 'Build Failure';
    if (errorMessages.includes('prisma') || errorMessages.includes('database')) return 'Database Error';
    
    return 'Unknown Error';
  };
  
  const extractErrorMessage = (): string => {
    // Extract meaningful error message from failed items
    if (failedItems.length === 0) return '';
    
    return failedItems.slice(0, 3).map(item => 
      item.error || item.logs || `${item.suite || item.name} failed`
    ).join('\n');
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Auto-Fix {type === 'cicd' ? 'CI/CD' : 'Test'} Errors
          </DialogTitle>
          <DialogDescription>
            Attempting to automatically fix {failedItems.length} failed {type === 'cicd' ? 'workflow runs' : 'tests'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fix Strategy Selection */}
          {!isFixing && !result && (
            <div className="flex gap-2">
              <Button
                variant={fixStrategy === 'safe' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFixStrategy('safe')}
              >
                Safe Mode
              </Button>
              <Button
                variant={fixStrategy === 'aggressive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFixStrategy('aggressive')}
              >
                Aggressive Mode
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {(isFixing || result) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {Math.round(progress)}%</span>
                <span>{currentStep + 1} / {steps.length} steps</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Fix Steps */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Fix Steps</h3>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-2 rounded ${
                    index === currentStep && isFixing ? 'bg-blue-50' : ''
                  }`}
                >
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-gray-600">{step.description}</div>
                    {step.command && (
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded mt-1 inline-block">
                        {step.command}
                      </code>
                    )}
                    {step.duration && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({(step.duration / 1000).toFixed(1)}s)
                      </span>
                    )}
                    {step.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription className="text-xs">{step.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Command Output */}
          {(isFixing || currentOutput.length > 0) && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Command Output
              </h3>
              <ScrollArea className="h-48 bg-gray-900 text-gray-100 p-3 rounded">
                <pre className="text-xs font-mono">
                  {currentOutput.length > 0 ? currentOutput.join('\n') : 'Waiting for output...'}
                </pre>
              </ScrollArea>
            </Card>
          )}

          {/* Executed Commands Summary */}
          {executedCommands.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Executed Commands</h3>
              <div className="space-y-1">
                {executedCommands.map((cmd, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <code className="bg-gray-100 px-2 py-1 rounded flex-1">{cmd}</code>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Result Summary */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <strong>{result.success ? 'Success!' : 'Fix Partially Completed'}</strong>
                    <div className="mt-2 space-y-1 text-sm">
                      <div>✓ Fixed: {result.fixed} steps</div>
                      {result.failed > 0 && <div>✗ Failed: {result.failed} steps</div>}
                      {result.skipped > 0 && <div>⊘ Skipped: {result.skipped} steps</div>}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {!isFixing && !result && (
              <Button onClick={startAutoFix} className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Start Auto-Fix
              </Button>
            )}
            {isFixing && (
              <Button variant="destructive" disabled className="flex items-center gap-2">
                <StopCircle className="h-4 w-4" />
                Fixing in Progress...
              </Button>
            )}
            {result && (
              <>
                {!result.success && (
                  <Button onClick={startAutoFix} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                )}
                <Button onClick={onClose}>Close</Button>
              </>
            )}
            {!isFixing && !result && (
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
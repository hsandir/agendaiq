'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Zap,
  Monitor,
  Clock,
  Globe,
  Terminal,
  Bug,
  Wifi,
  WifiOff,
  Play,
  Square
} from 'lucide-react';

interface ErrorEvent {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  source: 'production' | 'local';
  severity: 'low' | 'medium' | 'high' | 'critical';
  fixed?: boolean;
}

interface ProductionError {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  auth: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  frontend: 'healthy' | 'warning' | 'error';
  lastCheck: string;
}

export default function LiveMonitor() {
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    auth: 'healthy', 
    api: 'healthy',
    frontend: 'healthy',
    lastCheck: new Date().toISOString()
  });
  const [stats, setStats] = useState({
    totalErrors: 0,
    productionErrors: 0,
    localErrors: 0,
    criticalErrors: 0
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const wsRef = useRef<WebSocket>();

  // Production error monitoring
  const fetchProductionErrors = async () => {
    try {
      // Production sitesinden hata bilgilerini çek
      const response = await fetch('/api/monitoring/production-errors');
      if (response.ok) {
        const data = await response.json();
        return data.errors || [];
      }
    } catch (error: unknown) {
      console.error('Failed to fetch production errors:', error);
    }
    return [];
  };

  // System health check
  const checkSystemHealth = async () => {
    try {
      const [localHealth, prodHealth] = await Promise.all([
        fetch('/api/health').then(r => r.json()).catch(() => null),
        fetch('https://agendaiq.vercel.app/api/health').then(r => r.json()).catch(() => null)
      ]);

      const newHealth: SystemHealth = {
        database: prodHealth?.checks?.database === 'healthy (17ms)' ? 'healthy' : 'error',
        auth: 'healthy', // Auth durumunu kontrol et
        api: localHealth ? 'healthy' : 'error',
        frontend: 'healthy',
        lastCheck: new Date().toISOString()
      };

      setSystemHealth(newHealth);
    } catch (error: unknown) {
      console.error('Health check failed:', error);
    }
  };

  // Local error monitoring via window.onerror
  const setupLocalErrorMonitoring = () => {
    const originalError = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;

    window.onerror = (message, source, lineno, colno, error) => {
      const errorEvent: ErrorEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: typeof message === 'string' ? message : 'Unknown error',
        stack: error?.stack,
        url: source || window.location.href,
        userAgent: navigator.userAgent,
        source: 'local',
        severity: 'high'
      };

      setErrors(prev => [errorEvent, ...prev.slice(0, 99)]);
      originalError?.(message, source, lineno, colno, error);
      return false;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorEvent: ErrorEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        source: 'local',
        severity: 'critical'
      };

      setErrors(prev => [errorEvent, ...prev.slice(0, 99)]);
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event);
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.onerror = originalError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  };

  // Console monitoring
  const setupConsoleMonitoring = () => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      const message = (args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));

      const errorEvent: ErrorEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: `Console Error: ${message}`,
        url: window.location.href,
        userAgent: navigator.userAgent,
        source: 'local',
        severity: 'medium'
      };

      setErrors(prev => [errorEvent, ...prev.slice(0, 99)]);
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      const message = (args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));

      const errorEvent: ErrorEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: `Console Warning: ${message}`,
        url: window.location.href,
        userAgent: navigator.userAgent,
        source: 'local',
        severity: 'low'
      };

      setErrors(prev => [errorEvent, ...prev.slice(0, 99)]);
      originalConsoleWarn(...args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    setConnectionStatus('connecting');

    // Setup error monitoring
    const cleanupLocal = setupLocalErrorMonitoring();
    const cleanupConsole = setupConsoleMonitoring();

    // Regular health checks and error fetching
    intervalRef.current = setInterval(async () => {
      await checkSystemHealth();
      const prodErrors = await fetchProductionErrors();
      
      // Production hatalarını ekle
      prodErrors.forEach((error: ProductionError) => {
        setErrors(prev => {
          const exists = prev.find(e => e.id === error.id);
          if (!exists) {
            return [{
              ...error,
              source: 'production' as const,
              severity: 'high' as const
            }, ...prev.slice(0, 99)];
          }
          return prev;
        });
      });
    }, 2000); // Her 2 saniyede kontrol et

    setConnectionStatus('connected');

    return () => {
      cleanupLocal();
      cleanupConsole();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Update stats when errors change
  useEffect(() => {
    const newStats = {
      totalErrors: errors.length,
      productionErrors: errors.filter(e => e.source === 'production').length,
      localErrors: errors.filter(e => e.source === 'local').length,
      criticalErrors: errors.filter(e => e.severity === 'critical').length
    };
    setStats(newStats);
  }, [errors]);

  // Auto-start monitoring on mount
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Canlı Monitoring Sistemi</h2>
          <Badge className={`${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
                          connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
            {connectionStatus === 'connected' && <Wifi className="h-3 w-3 mr-1" />}
            {connectionStatus === 'disconnected' && <WifiOff className="h-3 w-3 mr-1" />}
            {connectionStatus === 'connecting' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
            {connectionStatus === 'connected' ? 'Bağlı' : 
             connectionStatus === 'connecting' ? 'Bağlanıyor' : 'Bağlantı Yok'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Durdur
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Başlat
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setErrors([])}>
            Temizle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Errors</p>
              <p className="text-2xl font-bold">{stats.totalErrors}</p>
            </div>
            <Bug className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Production</p>
              <p className="text-2xl font-bold text-red-600">{stats.productionErrors}</p>
            </div>
            <Globe className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lokal</p>
              <p className="text-2xl font-bold text-blue-600">{stats.localErrors}</p>
            </div>
            <Terminal className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Kritik</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalErrors}</p>
            </div>
            <Zap className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* System Health */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Sistem Durumu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            {getHealthIcon(systemHealth.database)}
            <span className="text-sm">Veritabanı</span>
          </div>
          <div className="flex items-center gap-2">
            {getHealthIcon(systemHealth.auth)}
            <span className="text-sm">Kimlik Doğrulama</span>
          </div>
          <div className="flex items-center gap-2">
            {getHealthIcon(systemHealth.api)}
            <span className="text-sm">API</span>
          </div>
          <div className="flex items-center gap-2">
            {getHealthIcon(systemHealth.frontend)}
            <span className="text-sm">Frontend</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Last check: {new Date(systemHealth.lastCheck).toLocaleTimeString('en-US')}
        </p>
      </Card>

      {/* Live Error Feed */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Live Error Stream</h3>
          <Badge variant="outline">{errors.length} errors</Badge>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-2">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>Henüz hata tespit edilmedi</p>
                <p className="text-sm">Sistem sağlıklı görünüyor 🎉</p>
              </div>
            ) : (
              errors.map((error) => (
                <div
                  key={error.id}
                  className={`p-3 border rounded-lg ${getSeverityColor(error.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={error.source === 'production' ? 
                            'bg-red-50 text-red-700 border-red-200' : 
                            'bg-blue-50 text-blue-700 border-blue-200'}
                        >
                          {error.source === 'production' ? (
                            <Globe className="h-3 w-3 mr-1" />
                          ) : (
                            <Terminal className="h-3 w-3 mr-1" />
                          )}
                          {error.source === 'production' ? 'Production' : 'Lokal'}
                        </Badge>
                        <Badge variant="outline" className={getSeverityColor(error.severity)}>
                          {error.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(error.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                      
                      <p className="font-medium text-sm mb-1 break-words">
                        {error.message}
                      </p>
                      
                      <p className="text-xs text-muted-foreground truncate">
                        📍 {error.url}
                      </p>
                      
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground">
                            Stack trace göster
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
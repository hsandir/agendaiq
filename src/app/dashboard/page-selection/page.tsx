'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Shield,
  Code,
  Server,
  Eye,
  Download,
  Upload
} from 'lucide-react'

// Page configuration type
interface PageConfig {
  path: string
  label: string
  category: 'main' | 'settings' | 'admin' | 'development' | 'production' | 'meeting'
  description?: string
  isProduction: boolean
  isDevelopment: boolean
  isEnabled: boolean
  dependencies?: string[]
  children?: PageConfig[]
}

// Default page configurations
const defaultPageConfigs: PageConfig[] = [
  // Main Pages
  {
    path: '/dashboard',
    label: 'Dashboard',
    category: 'main',
    description: 'Main dashboard with overview',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/meetings',
    label: 'Meetings',
    category: 'main',
    description: 'Meeting management',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/meeting-intelligence',
    label: 'Meeting Intelligence',
    category: 'main',
    description: 'AI-powered meeting insights',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true,
    children: [
      {
        path: '/dashboard/meeting-intelligence/search',
        label: 'Search',
        category: 'main',
        isProduction: true,
        isDevelopment: true,
        isEnabled: true
      },
      {
        path: '/dashboard/meeting-intelligence/analytics',
        label: 'Analytics',
        category: 'main',
        isProduction: true,
        isDevelopment: true,
        isEnabled: true
      },
      {
        path: '/dashboard/meeting-intelligence/action-items',
        label: 'Action Items',
        category: 'main',
        isProduction: true,
        isDevelopment: true,
        isEnabled: true
      }
    ]
  },
  
  // Settings Pages
  {
    path: '/dashboard/settings/profile',
    label: 'Profile',
    category: 'settings',
    description: 'User profile settings',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/settings/interface',
    label: 'Interface & Theme',
    category: 'settings',
    description: 'UI and theme preferences',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/settings/security',
    label: 'Security',
    category: 'settings',
    description: 'Security and 2FA settings',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  
  // Admin Pages
  {
    path: '/dashboard/settings/role-hierarchy',
    label: 'Role Hierarchy',
    category: 'admin',
    description: 'Manage user roles and hierarchy',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/settings/permissions',
    label: 'Permissions',
    category: 'admin',
    description: 'Role permissions management',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/settings/audit',
    label: 'Audit Logs',
    category: 'admin',
    description: 'System audit trail',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  
  // Production Pages
  {
    path: '/dashboard/settings/system',
    label: 'System Settings',
    category: 'production',
    description: 'System configuration',
    isProduction: true,
    isDevelopment: false,
    isEnabled: true
  },
  {
    path: '/dashboard/settings/backup',
    label: 'Backup & Restore',
    category: 'production',
    description: 'Database backup management',
    isProduction: true,
    isDevelopment: false,
    isEnabled: true
  },
  
  // Development Pages
  {
    path: '/dashboard/development',
    label: 'Development Tools',
    category: 'development',
    description: 'Developer dashboard with test runner',
    isProduction: false,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/monitoring',
    label: 'Live Monitoring',
    category: 'development',
    description: 'Real-time system monitoring',
    isProduction: false,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/debug',
    label: 'Debug Dashboard',
    category: 'development',
    description: 'Debug tools and capabilities check',
    isProduction: false,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/development/performance',
    label: 'Performance Monitor',
    category: 'development',
    description: 'Performance metrics and profiling',
    isProduction: false,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/development/permissions-check',
    label: 'Permissions Check',
    category: 'development',
    description: 'Test permission system',
    isProduction: false,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/tests',
    label: 'Test Dashboard',
    category: 'development',
    description: 'Jest test runner',
    isProduction: false,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/monitoring/cicd',
    label: 'CI/CD Monitor',
    category: 'development',
    description: 'Build and deployment monitoring',
    isProduction: false,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/auth/debug',
    label: 'Auth Debug',
    category: 'development',
    description: 'Authentication debugging (no auth required)',
    isProduction: false,
    isDevelopment: true,
    isEnabled: true
  },
  
  // Meeting Pages
  {
    path: '/dashboard/settings/meeting-templates',
    label: 'Meeting Templates',
    category: 'meeting',
    description: 'Meeting templates management',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/settings/meeting-management',
    label: 'Meeting Management',
    category: 'meeting',
    description: 'Meeting configuration',
    isProduction: true,
    isDevelopment: true,
    isEnabled: true
  },
  {
    path: '/dashboard/settings/zoom-integration',
    label: 'Zoom Integration',
    category: 'meeting',
    description: 'Zoom meeting integration',
    isProduction: true,
    isDevelopment: false,
    isEnabled: true
  }
]

export default function PageSelectionPage() {
  const [pageConfigs, setPageConfigs] = useState<PageConfig[]>(defaultPageConfigs)
  const [environment, setEnvironment] = useState<'development' | 'production'>('production')
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  // Load saved configuration
  useEffect(() => {
    loadConfiguration();
  }, [])

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/page-config');
      if (response.ok) {
        const data = await response.json();
        if (data.configs) {
          setPageConfigs(data.configs);
        }
        if (data.environment) {
          setEnvironment(data.environment);
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  const saveConfiguration = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/page-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          configs: pageConfigs,
          environment 
        })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        setHasChanges(false);
        // Generate menu configuration
        await generateMenuConfig();
      } else {
        setMessage({ type: 'error', text: 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving configuration' });
    } finally {
      setSaving(false);
    }
  }

  const generateMenuConfig = async () => {
    try {
      const response = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          configs: pageConfigs,
          environment 
        })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Menu configuration updated!' });
      }
    } catch (error) {
      console.error('Failed to generate menu:', error);
    }
  }

  const togglePage = (path: string, field: 'isProduction' | 'isDevelopment' | 'isEnabled') => {
    setPageConfigs(prev => prev.map(config => {
      if (config.path === path) {
        return { ...config, [field]: !config[field] }
      }
      if (config.children) {
        return {
          ...config,
          children: config.children.map(child => 
            child.path === path ? { ...child, [field]: !child[field] } : child
          )
        }
      }
      return config
    }))
    setHasChanges(true);
  }

  const selectAllCategory = (category: string, field: 'isProduction' | 'isDevelopment') => {
    setPageConfigs(prev => prev.map(config => {
      if (config.category === category) {
        return { ...config, [field]: true }
      }
      return config
    }))
    setHasChanges(true);
  }

  const deselectAllCategory = (category: string, field: 'isProduction' | 'isDevelopment') => {
    setPageConfigs(prev => prev.map(config => {
      if (config.category === category) {
        return { ...config, [field]: false }
      }
      return config
    }))
    setHasChanges(true);
  }

  const exportConfig = () => {
    const dataStr = JSON.stringify({ configs: pageConfigs, environment }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `page-config-${environment}-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  const categories = [
    { key: 'main', label: 'Main', icon: <Eye className="h-4 w-4" /> },
    { key: 'settings', label: 'Settings', icon: <Shield className="h-4 w-4" /> },
    { key: 'admin', label: 'Admin', icon: <Shield className="h-4 w-4" /> },
    { key: 'production', label: 'Production', icon: <Server className="h-4 w-4" /> },
    { key: 'development', label: 'Development', icon: <Code className="h-4 w-4" /> },
    { key: 'meeting', label: 'Meeting', icon: <FileText className="h-4 w-4" /> }
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Page Selection & Deployment Configuration</CardTitle>
              <CardDescription>
                Select which pages to include in production deployment
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={environment === 'production' ? 'default' : 'secondary'}>
                {environment === 'production' ? 'Production Mode' : 'Development Mode'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {message.type === 'error' && <XCircle className="h-4 w-4" />}
          {message.type === 'info' && <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Environment Selection</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={environment === 'development' ? 'default' : 'outline'}
                onClick={() => { setEnvironment('development'); setHasChanges(true) }}
              >
                <Code className="h-4 w-4 mr-2" />
                Development
              </Button>
              <Button
                variant={environment === 'production' ? 'default' : 'outline'}
                onClick={() => { setEnvironment('production'); setHasChanges(true) }}
              >
                <Server className="h-4 w-4 mr-2" />
                Production
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="main" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          {categories.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key}>
              {cat.icon}
              <span className="ml-1">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.key} value={category.key}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{category.label} Pages</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectAllCategory(category.key, environment === 'production' ? 'isProduction' : 'isDevelopment')}
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deselectAllCategory(category.key, environment === 'production' ? 'isProduction' : 'isDevelopment')}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pageConfigs
                    .filter(config => config.category === category.key);
                    .map(config => (
                      <div key={config.path} className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={environment === 'production' ? config.isProduction : config.isDevelopment}
                              onChange={() => togglePage(config.path, environment === 'production' ? 'isProduction' : 'isDevelopment')}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <div>
                              <div className="font-medium">{config.label}</div>
                              <div className="text-sm text-muted-foreground">{config.path}</div>
                              {config.description && (
                                <div className="text-xs text-muted-foreground mt-1">{config.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                              {config.isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            {config.isProduction && (
                              <Badge variant="outline">Prod</Badge>
                            )}
                            {config.isDevelopment && (
                              <Badge variant="outline">Dev</Badge>
                            )}
                          </div>
                        </div>
                        
                        {config.children && (
                          <div className="ml-8 space-y-2">
                            {config.children.map(child => (
                              <div key={child.path} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={environment === 'production' ? child.isProduction : child.isDevelopment}
                                    onChange={() => togglePage(child.path, environment === 'production' ? 'isProduction' : 'isDevelopment')}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                  <div>
                                    <div className="text-sm">{child.label}</div>
                                    <div className="text-xs text-muted-foreground">{child.path}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {hasChanges && 'You have unsaved changes'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportConfig}>
                <Download className="h-4 w-4 mr-2" />
                Export Config
              </Button>
              <Button variant="outline" onClick={loadConfiguration}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={saveConfiguration} 
                disabled={!hasChanges || saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Apply
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
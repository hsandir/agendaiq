"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bell, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Settings,
  Save,
  Mail,
  MessageSquare,
  Smartphone
} from "lucide-react";
import Link from "next/link";

interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'error' | 'warning' | 'info';
  condition: string;
  threshold: number;
  enabled: boolean;
  channels: string[];
  lastTriggered?: string;
  triggerCount: number;
}

interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  enabled: boolean;
  config: Record<string, any>;
}

interface AlertsConfig {
  rules: AlertRule[];
  channels: AlertChannel[];
  globalSettings: {
    enableAlerts: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    escalation: {
      enabled: boolean;
      delay: number;
    };
  };
}

export default function AlertsConfigurationPage() {
  const [alertsConfig, setAlertsConfig] = useState<AlertsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const fetchAlertsConfig = async () => {
    try {
      setLoading(true);
      
      // Fetch real alerts configuration from API
      const response = await fetch('/api/system/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlertsConfig(data);
      } else {
        throw new Error('Failed to fetch alerts configuration');
      }
    } catch (error) {
      console.error('Failed to fetch alerts configuration:', error);
      showNotification('Failed to fetch alerts configuration');
      
      // Fallback to mock data if API fails
      const mockAlertsConfig: AlertsConfig = {
        rules: [
          {
            id: "1",
            name: "Database Connection Failure",
            description: "Alert when database connection fails or times out",
            type: "error",
            condition: "database.connection.failed",
            threshold: 1,
            enabled: true,
            channels: ["email", "slack"],
            lastTriggered: "2024-06-01T10:45:23Z",
            triggerCount: 3
          },
          {
            id: "2",
            name: "High Memory Usage",
            description: "Alert when memory usage exceeds 80%",
            type: "warning",
            condition: "system.memory.usage",
            threshold: 80,
            enabled: true,
            channels: ["email"],
            triggerCount: 0
          },
          {
            id: "3",
            name: "API Rate Limit Exceeded",
            description: "Alert when API rate limits are exceeded",
            type: "warning",
            condition: "api.ratelimit.exceeded",
            threshold: 5,
            enabled: true,
            channels: ["slack"],
            lastTriggered: "2024-06-01T09:30:12Z",
            triggerCount: 12
          },
          {
            id: "4",
            name: "Failed Login Attempts",
            description: "Alert on multiple failed login attempts",
            type: "warning",
            condition: "auth.failed_attempts",
            threshold: 5,
            enabled: false,
            channels: ["email", "slack"],
            triggerCount: 0
          },
          {
            id: "5",
            name: "Backup Completion",
            description: "Notify when daily backup is completed",
            type: "info",
            condition: "backup.completed",
            threshold: 1,
            enabled: true,
            channels: ["email"],
            lastTriggered: "2024-06-01T02:00:00Z",
            triggerCount: 1
          }
        ],
        channels: [
          {
            id: "email",
            name: "Email Notifications",
            type: "email",
            enabled: true,
            config: {
              recipients: ["admin@agendaiq.com", "alerts@agendaiq.com"],
              subject_prefix: "[AgendaIQ Alert]"
            }
          },
          {
            id: "slack",
            name: "Slack Alerts",
            type: "slack",
            enabled: true,
            config: {
              webhook_url: "https://hooks.slack.com/services/***",
              channel: "#system-alerts",
              username: "AgendaIQ Bot"
            }
          },
          {
            id: "webhook",
            name: "Custom Webhook",
            type: "webhook",
            enabled: false,
            config: {
              url: "https://your-webhook-url.com/alerts",
              method: "POST"
            }
          },
          {
            id: "sms",
            name: "SMS Alerts",
            type: "sms",
            enabled: false,
            config: {
              numbers: ["+1234567890"],
              provider: "twilio"
            }
          }
        ],
        globalSettings: {
          enableAlerts: true,
          quietHours: {
            enabled: true,
            start: "22:00",
            end: "08:00"
          },
          escalation: {
            enabled: true,
            delay: 30
          }
        }
      };
      
      setAlertsConfig(mockAlertsConfig);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      
      if (!alertsConfig) return;
      
      // Save configuration to API
      const response = await fetch('/api/system/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertsConfig),
      });
      
      if (response.ok) {
        showNotification('Alert configuration saved successfully!');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      showNotification('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    if (!alertsConfig) return;
    
    setAlertsConfig(prev => ({
      ...prev!,
      rules: prev!.rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    }));
  };

  const toggleChannel = (channelId: string) => {
    if (!alertsConfig) return;
    
    setAlertsConfig(prev => ({
      ...prev!,
      channels: prev!.channels.map(channel =>
        channel.id === channelId ? { ...channel, enabled: !channel.enabled } : channel
      )
    }));
  };

  useEffect(() => {
    fetchAlertsConfig();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4" />;
      case 'sms':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading alerts configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Bell className="w-8 h-8 mr-3 text-purple-600" />
              Alert Configuration
            </h1>
            <p className="text-muted-foreground">Configure system alerts and notifications</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={saveConfiguration}
            size="sm"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Config
              </>
            )}
          </Button>
          <Button 
            onClick={fetchAlertsConfig}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Fixed position notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <Alert key={index} className="bg-background border shadow-lg">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        ))}
      </div>

      {alertsConfig && (
        <>
          {/* Global Settings */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-600" />
                Global Settings
              </CardTitle>
              <CardDescription>Configure global alert settings and behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enable Alerts</h4>
                    <p className="text-sm text-muted-foreground">Master switch for all alert notifications</p>
                  </div>
                  <Switch 
                    checked={alertsConfig.globalSettings.enableAlerts}
                    onCheckedChange={(checked) => {
                      setAlertsConfig(prev => ({
                        ...prev!,
                        globalSettings: {
                          ...prev!.globalSettings,
                          enableAlerts: checked
                        }
                      }));
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Quiet Hours</h4>
                    <p className="text-sm text-muted-foreground">
                      Suppress non-critical alerts during: {alertsConfig.globalSettings.quietHours.start} - {alertsConfig.globalSettings.quietHours.end}
                    </p>
                  </div>
                  <Switch 
                    checked={alertsConfig.globalSettings.quietHours.enabled}
                    onCheckedChange={(checked) => {
                      setAlertsConfig(prev => ({
                        ...prev!,
                        globalSettings: {
                          ...prev!.globalSettings,
                          quietHours: {
                            ...prev!.globalSettings.quietHours,
                            enabled: checked
                          }
                        }
                      }));
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Alert Escalation</h4>
                    <p className="text-sm text-muted-foreground">
                      Escalate unacknowledged alerts after {alertsConfig.globalSettings.escalation.delay} minutes
                    </p>
                  </div>
                  <Switch 
                    checked={alertsConfig.globalSettings.escalation.enabled}
                    onCheckedChange={(checked) => {
                      setAlertsConfig(prev => ({
                        ...prev!,
                        globalSettings: {
                          ...prev!.globalSettings,
                          escalation: {
                            ...prev!.globalSettings.escalation,
                            enabled: checked
                          }
                        }
                      }));
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Alert Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Alert Rules
                </CardTitle>
                <CardDescription>Configure when alerts should be triggered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertsConfig.rules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {getTypeIcon(rule.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{rule.name}</h4>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex space-x-4">
                          <span>Threshold: {rule.threshold}</span>
                          <span>Triggered: {rule.triggerCount}x</span>
                        </div>
                        {rule.lastTriggered && (
                          <span>Last: {formatTimestamp(rule.lastTriggered)}</span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex space-x-1">
                        {rule.channels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Channels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-blue-600" />
                  Notification Channels
                </CardTitle>
                <CardDescription>Configure how alerts are delivered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertsConfig.channels.map((channel) => (
                    <div key={channel.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getChannelIcon(channel.type)}
                          <div>
                            <h4 className="font-medium">{channel.name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{channel.type} notifications</p>
                          </div>
                        </div>
                        <Switch 
                          checked={channel.enabled}
                          onCheckedChange={() => toggleChannel(channel.id)}
                        />
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground">
                        {channel.type === 'email' && (
                          <div>Recipients: {channel.config.recipients?.join(', ')}</div>
                        )}
                        {channel.type === 'slack' && (
                          <div>Channel: {channel.config.channel}</div>
                        )}
                        {channel.type === 'sms' && (
                          <div>Numbers: {channel.config.numbers?.join(', ')}</div>
                        )}
                        {channel.type === 'webhook' && (
                          <div>URL: {channel.config.url}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Alert Statistics
              </CardTitle>
              <CardDescription>Overview of alert activity and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {alertsConfig.rules.filter(r => r.enabled).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Rules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {alertsConfig.channels.filter(c => c.enabled).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Channels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {alertsConfig.rules.reduce((sum, rule) => sum + rule.triggerCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Triggers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {alertsConfig.rules.filter(r => r.lastTriggered).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Recently Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
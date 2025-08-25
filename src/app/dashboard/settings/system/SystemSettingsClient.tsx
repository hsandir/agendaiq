'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface SystemSettingsClientProps {
  initialSettings: Record<string, any>;
}

interface SystemSettings {
  school_name: string;
  academic_year: string;
  timezone: string;
  two_factor_required: boolean;
  password_policy_enabled: boolean;
  session_timeout_minutes: number;
  smtp_server: string;
  smtp_port: number;
  sender_email: string;
  automatic_backups_enabled: boolean;
  backup_frequency: string;
  backup_retention_days: number;
}

export default function SystemSettingsClient({ initialSettings }: SystemSettingsClientProps) {
  const [settings, setSettings] = useState<SystemSettings>({
    school_name: initialSettings.school_name ?? '',
    academic_year: initialSettings.academic_year || '2024-2025',
    timezone: initialSettings.timezone ?? 'UTC',
    two_factor_required: initialSettings.two_factor_required ?? false,
    password_policy_enabled: initialSettings.password_policy_enabled ?? false,
    session_timeout_minutes: initialSettings.session_timeout_minutes ?? 30,
    smtp_server: initialSettings.smtp_server ?? '',
    smtp_port: initialSettings.smtp_port ?? 587,
    sender_email: initialSettings.sender_email ?? '',
    automatic_backups_enabled: initialSettings.automatic_backups_enabled ?? false,
    backup_frequency: initialSettings.backup_frequency ?? 'daily',
    backup_retention_days: initialSettings.backup_retention_days ?? 30,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { __toast } = useToast();

  // Check for changes
  useEffect(() => {
    const hasAnyChanges = Object.keys(settings).some(key => {
      const initialValue = initialSettings[key];
      const currentValue = settings[key as keyof SystemSettings];
      return initialValue !== currentValue;
    });
    setHasChanges(hasAnyChanges);
  }, [settings, initialSettings]);

  const handleSettingChange = (key: keyof SystemSettings, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const result = await response.json();
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });

      // Update initial settings to reflect the saved state
      Object.assign(initialSettings, settings);
      setHasChanges(false);

    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges ?? isLoading}
          className="ml-auto"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic system configuration options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="school_name">School Name</Label>
                <Input
                  id="school_name"
                  value={settings.school_name}
                  onChange={(e) => handleSettingChange('school_name', e.target.value)}
                  placeholder="Enter school name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_year">Academic Year</Label>
                <Select 
                  value={settings.academic_year} 
                  onValueChange={(value) => handleSettingChange('academic_year', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Select 
                  value={settings.timezone} 
                  onValueChange={(value) => handleSettingChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>System-wide security configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <Switch 
                checked={settings.two_factor_required}
                onCheckedChange={(checked) => handleSettingChange('two_factor_required', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Password Policy</h3>
                <p className="text-sm text-muted-foreground">
                  Enforce strong password requirements
                </p>
              </div>
              <Switch 
                checked={settings.password_policy_enabled}
                onCheckedChange={(checked) => handleSettingChange('password_policy_enabled', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Select 
                value={settings.session_timeout_minutes.toString()} 
                onValueChange={(value) => handleSettingChange('session_timeout_minutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure email notification settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_server">SMTP Server</Label>
                <Input
                  id="smtp_server"
                  value={settings.smtp_server}
                  onChange={(e) => handleSettingChange('smtp_server', e.target.value)}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => handleSettingChange('smtp_port', parseInt(e.target.value))}
                  placeholder="587"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_email">Sender Email</Label>
                <Input
                  id="sender_email"
                  type="email"
                  value={settings.sender_email}
                  onChange={(e) => handleSettingChange('sender_email', e.target.value)}
                  placeholder="noreply@school.edu"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup Settings</CardTitle>
            <CardDescription>Configure system backup preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Automatic Backups</h3>
                <p className="text-sm text-muted-foreground">
                  Enable scheduled system backups
                </p>
              </div>
              <Switch 
                checked={settings.automatic_backups_enabled}
                onCheckedChange={(checked) => handleSettingChange('automatic_backups_enabled', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup_frequency">Backup Frequency</Label>
              <Select 
                value={settings.backup_frequency} 
                onValueChange={(value) => handleSettingChange('backup_frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup_retention">Retention Period (days)</Label>
              <Select 
                value={settings.backup_retention_days.toString()} 
                onValueChange={(value) => handleSettingChange('backup_retention_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
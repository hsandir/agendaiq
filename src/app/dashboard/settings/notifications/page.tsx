import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Notification Settings",
  description: "Manage your notification preferences",
};

export default async function NotificationsPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
        <p className="text-muted-foreground">
          Manage how you receive notifications and updates.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Configure your email notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Meeting Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Receive email reminders for upcoming meetings
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Task Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when tasks are assigned or updated
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">System Announcements</h3>
                <p className="text-sm text-muted-foreground">
                  Important system updates and announcements
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In-App Notifications</CardTitle>
            <CardDescription>Manage your in-app notification settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Desktop Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Show desktop notifications when browser is open
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Sound Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Play sound when receiving notifications
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Schedule</CardTitle>
            <CardDescription>Set your notification delivery schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Do Not Disturb</h3>
                <p className="text-sm text-muted-foreground">
                  Pause all notifications during specified hours
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Weekly Digest</h3>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of all activities
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
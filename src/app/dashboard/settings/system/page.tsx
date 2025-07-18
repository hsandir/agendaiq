import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "System Settings",
  description: "Configure system-wide settings and preferences",
};

export default async function SystemSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      Staff: {
        include: {
          Role: true
        }
      }
    },
  });

  if (!user || user.Staff?.[0]?.Role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic system configuration options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">School Name</label>
                <input
                  type="text"
                  placeholder="Enter school name"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Academic Year</label>
                <select className="w-full p-2 border rounded-md">
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Time Zone</label>
                <select className="w-full p-2 border rounded-md">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
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
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Password Policy</h3>
                <p className="text-sm text-muted-foreground">
                  Enforce strong password requirements
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Session Timeout</label>
              <select className="w-full p-2 border rounded-md">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
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
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">SMTP Server</label>
                <input
                  type="text"
                  placeholder="smtp.example.com"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">SMTP Port</label>
                <input
                  type="number"
                  placeholder="587"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Sender Email</label>
                <input
                  type="email"
                  placeholder="noreply@school.edu"
                  className="w-full p-2 border rounded-md"
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
              <Switch defaultChecked />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Backup Frequency</label>
              <select className="w-full p-2 border rounded-md">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Retention Period</label>
              <select className="w-full p-2 border rounded-md">
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
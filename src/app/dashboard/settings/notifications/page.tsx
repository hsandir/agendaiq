import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Bell, Mail, Clock, Settings, Users, Calendar, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Notification Settings | AgendaIQ",
  description: "Manage your notification preferences and system alerts",
};

export default async function NotificationsPage() {
  // Use new standardized auth system
  const user = await requireAuth(AuthPresets.requireAuth);

  // Fetch user's notification settings and recent notifications
  const userWithSettings = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      Staff: {
        include: {
          Role: true,
          Department: true
        }
      }
    }
  });

  // Get recent system notifications/activities
  const recentActivities = await prisma.meeting.findMany({
    where: {
      organizer_id: userWithSettings?.Staff?.[0]?.id
    },
    orderBy: {
      start_time: 'desc'
    },
    take: 5
  });

  // Calculate notification statistics
  const totalMeetings = recentActivities.length;
  const upcomingMeetings = recentActivities.filter(meeting => 
    meeting.start_time && new Date(meeting.start_time) > new Date()
  ).length;
  const pastMeetings = totalMeetings - upcomingMeetings;

  // Notification categories based on user role
  const notificationCategories = [
    {
      name: "Meeting Notifications",
      icon: Calendar,
      description: "Stay updated with meeting schedules and changes",
      settings: [
        {
          name: "Meeting Reminders",
          description: "Receive reminders 15 minutes before meetings",
          enabled: true,
          type: "email"
        },
        {
          name: "Meeting Updates",
          description: "Get notified when meeting details change",
          enabled: true,
          type: "in-app"
        },
        {
          name: "Meeting Cancellations",
          description: "Immediate notification when meetings are cancelled",
          enabled: true,
          type: "both"
        }
      ]
    },
    {
      name: "System Notifications",
      icon: Settings,
      description: "Important system updates and announcements",
      settings: [
        {
          name: "System Maintenance",
          description: "Notifications about scheduled maintenance",
          enabled: true,
          type: "email"
        },
        {
          name: "Security Alerts",
          description: "Important security updates and alerts",
          enabled: true,
          type: "both"
        },
        {
          name: "Feature Updates",
          description: "New features and improvements",
          enabled: false,
          type: "in-app"
        }
      ]
    },
    {
      name: "Role-Based Notifications",
      icon: Users,
      description: "Notifications based on your role and responsibilities",
      settings: userWithSettings?.Staff?.[0]?.Role?.is_leadership ? [
        {
          name: "Staff Updates",
          description: "When staff members join or leave your department",
          enabled: true,
          type: "email"
        },
        {
          name: "Department Reports",
          description: "Weekly department activity summaries",
          enabled: true,
          type: "email"
        },
        {
          name: "Leadership Alerts",
          description: "Important alerts requiring leadership attention",
          enabled: true,
          type: "both"
        }
      ] : [
        {
          name: "Task Assignments",
          description: "When new tasks are assigned to you",
          enabled: true,
          type: "in-app"
        },
        {
          name: "Role Changes",
          description: "When your role or permissions change",
          enabled: true,
          type: "email"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
        <p className="text-muted-foreground">
          Manage how you receive notifications and updates based on your role and preferences.
        </p>
      </div>

      {/* Notification Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Recent meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pastMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Past meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userWithSettings?.Staff?.[0]?.Role?.title || 'No Role'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userWithSettings?.Staff?.[0]?.Role?.is_leadership ? 'Leadership' : 'Regular User'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Categories */}
      <div className="grid gap-6">
        {notificationCategories.map((category) => (
          <Card key={category.name}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <category.icon className="h-5 w-5 text-blue-600" />
                <CardTitle>{category.name}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.settings.map((setting, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium">{setting.name}</h3>
                      <Badge variant={setting.enabled ? "default" : "secondary"} className="text-xs">
                        {setting.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Delivery:</span>
                      <Badge variant="outline" className="text-xs">
                        {setting.type === 'email' && <Mail className="h-3 w-3 mr-1" />}
                        {setting.type === 'in-app' && <Bell className="h-3 w-3 mr-1" />}
                        {setting.type === 'both' && (
                          <>
                            <Mail className="h-3 w-3 mr-1" />
                            <Bell className="h-3 w-3 mr-1" />
                          </>
                        )}
                        {setting.type}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Your recent meeting activities and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium">{meeting.title}</h3>
                      <Badge variant={meeting.start_time && new Date(meeting.start_time) > new Date() ? "default" : "secondary"} className="text-xs">
                        {meeting.start_time && new Date(meeting.start_time) > new Date() ? "Upcoming" : "Past"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {meeting.start_time && new Date(meeting.start_time).toLocaleDateString()} at {meeting.start_time && new Date(meeting.start_time).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Organized by: {userWithSettings?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Meeting ID: {meeting.id}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activities found.</p>
                <p className="text-sm mt-2">Your meeting activities will appear here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure your notification delivery preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Email Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Daily digest emails</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Meeting reminders</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Marketing emails</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">In-App Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Desktop notifications</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Sound alerts</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Banner notifications</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button className="w-full">
                Save Notification Preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
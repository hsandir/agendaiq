import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { Video, Settings, Bell, Calendar, Link, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { safeFormatDate, safeFormatTime, safeFormatDateTime } from '@/lib/utils/safe-date';

export const metadata: Metadata = {
  title: "Zoom User Preferences | AgendaIQ",
  description: "Manage your Zoom integration settings and meeting preferences",
};

export default async function ZoomUserPreferences() {
  // Use new standardized auth system
  const user = await requireAuth(AuthPresets.requireAuth);

  // Fetch user's Zoom integration status and preferences
  const userWithZoom = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      staff: {
        include: {
          role: true,
          department: true
        }
      }
    }
  });

  // Get user's meeting statistics for Zoom integration
  const userMeetings = await prisma.meeting.findMany({
    where: {
      organizer_id: userWithZoom?.staff?.[0]?.id
    },
    orderBy: {
      start_time: 'desc'
    },
    take: 10
  });

  // Calculate Zoom-related statistics
  const totalMeetings = userMeetings.length;
  const upcomingMeetings = userMeetings.filter(meeting => 
    meeting.start_time && new Date(meeting.start_time) > new Date()
  ).length;
  const pastMeetings = totalMeetings - upcomingMeetings;

  // Zoom integration status (mock data for now, would be real in production)
  const zoomIntegration = {
    connected: false,
    accountEmail: null,
    lastSync: null,
    meetingCount: 0,
    settings: {
      autoMute: true,
      videoOnDefault: false,
      defaultDuration: 30,
      calendarSync: true,
      emailReminders: true,
      smsReminders: false
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Zoom User Preferences</h2>
        <p className="text-muted-foreground">
          Manage your Zoom integration settings and meeting preferences for seamless virtual meetings.
        </p>
      </div>

      {/* Zoom Integration Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integration Status</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {zoomIntegration.connected ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm font-medium">
                {zoomIntegration.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {zoomIntegration.connected ? "Zoom account linked" : "Connect your Zoom account"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Meetings created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{upcomingMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zoom Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zoomIntegration.meetingCount}</div>
            <p className="text-xs text-muted-foreground">
              Zoom meetings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zoom Account Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-primary" />
            Zoom Account Integration
          </CardTitle>
          <CardDescription>
            Connect your Zoom account to enable automatic meeting creation and management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {zoomIntegration.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Zoom Account Connected</p>
                    <p className="text-xs text-green-600">
                      Account: {zoomIntegration.accountEmail ?? 'Unknown'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
              
              {zoomIntegration.lastSync && (
                <div className="text-sm text-muted-foreground">
                  Last synchronized: {safeFormatDateTime(zoomIntegration.lastSync)}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Zoom Account Not Connected</p>
                    <p className="text-xs text-yellow-600">
                      Connect your account to enable Zoom integration
                    </p>
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary">
                  <Link className="h-4 w-4 mr-2" />
                  Connect Zoom Account
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Connecting your Zoom account will enable:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Automatic Zoom meeting creation</li>
                  <li>Calendar synchronization</li>
                  <li>Meeting link generation</li>
                  <li>Participant management</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure how you receive Zoom meeting notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Receive email notifications before Zoom meetings
                </p>
              </div>
              <Switch defaultChecked={zoomIntegration.settings.emailReminders} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">SMS Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Receive SMS notifications for urgent meetings
                </p>
              </div>
              <Switch defaultChecked={zoomIntegration.settings.smsReminders} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Calendar Integration</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically add Zoom meetings to your calendar
                </p>
              </div>
              <Switch defaultChecked={zoomIntegration.settings.calendarSync} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Meeting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            Default Meeting Settings
          </CardTitle>
          <CardDescription>
            Configure default settings for new Zoom meetings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Preferred Meeting Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                defaultValue={zoomIntegration.settings.defaultDuration}
                min="15"
                max="480"
                step="15"
                className="w-32"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Auto-mute on Join</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically mute participants when they join
                </p>
              </div>
              <Switch defaultChecked={zoomIntegration.settings.autoMute} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Video On by Default</Label>
                <p className="text-xs text-muted-foreground">
                  Start meetings with video enabled
                </p>
              </div>
              <Switch defaultChecked={zoomIntegration.settings.videoOnDefault} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Waiting Room</Label>
                <p className="text-xs text-muted-foreground">
                  Enable waiting room for all meetings
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Record Meetings</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically record all meetings
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Zoom Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5 text-primary" />
            Recent Zoom Meetings
          </CardTitle>
          <CardDescription>
            Your recent meetings that could be integrated with Zoom
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userMeetings.length > 0 ? (
              userMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium">{meeting.title}</h3>
                      <Badge variant={new Date(meeting.start_time ?? '') > new Date() ? "default" : "secondary"} className="text-xs">
                        {new Date(meeting.start_time ?? '') > new Date() ? "Upcoming" : "Past"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {safeFormatDate(meeting.start_time)} at {safeFormatTime(meeting.start_time)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Create Zoom
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No meetings found.</p>
                <p className="text-sm mt-2">Create meetings to enable Zoom integration.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-green-600 hover:bg-green-700">
          Save Zoom Preferences
        </Button>
      </div>
    </div>
  );
} 
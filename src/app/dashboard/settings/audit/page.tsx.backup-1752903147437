import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FiUser, FiSettings, FiLock, FiUserCheck, FiCalendar, FiUsers, FiFileText } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Meeting Audit Log",
  description: "View meeting audit logs and activity",
};

export default async function AuditPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: user.email },
    include: { 
      Staff: {
        include: {
          Role: true
        }
      }
    }
  });

  if (!user || user.staff?.Role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  // Fetch real meeting audit logs
  const auditLogs = await prisma.meetingAuditLog.findMany({
    include: {
      User: true,
      Meeting: {
        include: {
          Staff: {
            include: {
              User: true
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 50 // Limit to last 50 logs
  });

  // Map action types to icons and descriptions
  const getActionDetails = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'meeting_created':
        return { icon: FiCalendar, category: 'meeting' };
      case 'updated':
      case 'meeting_updated':
        return { icon: FiSettings, category: 'meeting' };
      case 'deleted':
      case 'meeting_deleted':
        return { icon: FiLock, category: 'security' };
      case 'attendee_added':
        return { icon: FiUsers, category: 'attendee' };
      case 'attendee_removed':
        return { icon: FiUser, category: 'attendee' };
      case 'note_added':
        return { icon: FiFileText, category: 'content' };
      default:
        return { icon: FiUserCheck, category: 'general' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meeting Audit Log</h2>
        <p className="text-muted-foreground">
          View and monitor meeting activities and changes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Activity History</CardTitle>
          <CardDescription>Recent meeting activities and changes ({auditLogs.length} entries).</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found. Meeting activities will appear here.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-0 top-0 w-px h-full bg-border" />
              <div className="space-y-8">
                {auditLogs.map((log) => {
                  const { icon: Icon, category } = getActionDetails(log.action);
                  return (
                    <div key={log.id} className="relative pl-8">
                      <div className="absolute left-0 top-2 -translate-x-1/2">
                        <div className="p-1 rounded-full bg-background border">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium leading-none">
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <div className="ml-auto text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Meeting: {log.Meeting.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          By: {log.User.name || log.User.email}
                        </p>
                        {log.details && typeof log.details === 'object' && (
                          <p className="text-sm text-muted-foreground">
                            Details: {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log Settings</CardTitle>
          <CardDescription>Configure audit log preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Retention Period</label>
              <select className="w-full p-2 border rounded-md">
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Log Level</label>
              <select className="w-full p-2 border rounded-md">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
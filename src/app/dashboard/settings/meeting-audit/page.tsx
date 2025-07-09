import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function MeetingAuditLogs() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Get user with staff relationship to check permissions
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      staff: {
        include: {
          role: true
        }
      }
    }
  });

  const isAdmin = user?.staff?.[0]?.role?.title === "Administrator";

  // Get audit logs - admins see all, users see only their own
  const auditLogs = await prisma.meetingAuditLog.findMany({
    where: isAdmin ? {} : {
      user_id: user?.id
    },
    include: {
      meeting: {
        select: {
          title: true,
          id: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 100 // Limit to last 100 entries
  });

  // Get all meetings to show which ones exist
  const allMeetings = await prisma.meeting.findMany({
    where: isAdmin ? {} : {
      OR: [
        { organizer_id: user?.staff?.[0]?.id },
        {
          attendees: {
            some: {
              staff_id: user?.staff?.[0]?.id
            }
          }
        }
      ]
    },
    include: {
      organizer: {
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 20
  });

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return '➕';
      case 'updated':
        return '✏️';
      case 'deleted':
        return '🗑️';
      case 'joined':
        return '👥';
      case 'declined':
        return '❌';
      case 'left':
        return '🚪';
      default:
        return '📝';
    }
  };

  return (
    <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Meeting Audit & Logs
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track all meeting-related activities and changes
          </p>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="overflow-hidden rounded-lg bg-white shadow mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Log</h3>
          {auditLogs.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-500">
                Showing {auditLogs.length} audit log entries {!isAdmin && "(your activities only)"}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meeting
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{log.user.name || log.user.email}</div>
                          <div className="text-sm text-gray-500">{log.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-2">{getActionIcon(log.action)}</span>
                            <span className="text-sm font-medium text-gray-900 capitalize">{log.action}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.meeting?.title || `Meeting #${log.meeting_id}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.details && typeof log.details === 'object' ? 
                            JSON.stringify(log.details) : 
                            log.details || '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity logs yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Meeting activities will appear here once they occur. Create or edit meetings to generate activity logs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Existing Meetings Section */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">All Meetings</h3>
          {allMeetings.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-500">
                Showing {allMeetings.length} meetings {!isAdmin && "(your meetings only)"}
                {auditLogs.length === 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                      <strong>Note:</strong> Meetings created before the audit system was implemented may not have activity logs. 
                      Future activities on these meetings will be tracked.
                    </p>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meeting
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organizer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Audit Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allMeetings.map((meeting) => {
                      const hasAuditLogs = auditLogs.some(log => log.meeting_id === meeting.id);
                      return (
                        <tr key={meeting.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                            {meeting.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{meeting.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {meeting.organizer.user.name || meeting.organizer.user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {meeting.start_time ? format(new Date(meeting.start_time), 'MMM d, yyyy HH:mm') : 'TBD'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(meeting.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {hasAuditLogs ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Tracked
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Legacy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a3 3 0 110-6 3 3 0 010 6z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No meetings have been scheduled yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
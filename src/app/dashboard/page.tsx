import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Calendar, Users, FileText } from "lucide-react";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { safeFormatDateTime } from '@/lib/utils/safe-date';
// Removed DashboardContent for simplicity

export default async function DashboardPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  // Check if any district exists
  const districtCount = await prisma.district.count();
  
  // Get user with staff information first
  const userWithStaff = await prisma.users.findUnique({
    where: { email: user.email! },
    include: {
      staff: {
        include: {
          role: true,
          department: true,
          school: true
        }
      }
    },
  });
  
  const isAdmin = isUserAdmin(userWithStaff);
  
  // If no district exists and user is admin, redirect to district setup
  if (districtCount === 0 && isAdmin) {
    redirect("/setup/district");
  }

  // If no district exists and user is not admin, show waiting message
  if (districtCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="max-w-md w-full space-y-8 p-6">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Waiting for Setup
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Please wait while an administrator sets up the district.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const userId = userWithStaff?.id;
  const staffId = userWithStaff?.staff?.[0]?.id;
  
  if (!userId) {
    redirect("/auth/signin");
  }
  
  // Fetch upcoming meetings for the user
  const upcomingMeetings = staffId ? await prisma.meeting.findMany({
    where: {
      OR: [
        { organizer_id: staffId },
        {
          meeting_attendee: {
            some: {
              staff_id: staffId,
              status: "ACCEPTED",
            },
          },
        },
      ],
      start_time: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      start_time: true,
      end_time: true,
      status: true,
      organizer_id: true,
      created_at: true,
      staff: {
        select: {
          id: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      meeting_attendee: {
        select: {
          id: true,
          staff_id: true,
          status: true,
          staff: {
            select: {
              id: true,
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      },
    },
    orderBy: {
      start_time: "asc",
    },
    take: 5,
  }) : [];

  // Fetch quick stats
  const stats = staffId ? await prisma.$transaction([
    prisma.meeting.count({
      where: {
        start_time: {
          gte: new Date(),
        },
        OR: [
          { organizer_id: staffId },
          {
            meeting_attendee: {
              some: {
                staff_id: staffId,
                status: "ACCEPTED",
              },
            },
          },
        ],
      },
    }),
    prisma.meeting.count({
      where: {
        organizer_id: staffId,
      },
    }),
    prisma.meeting_notes.count({
      where: {
        staff_id: staffId,
      },
    }),
  ]) : [0, 0, 0];

  // Fetch recent activity - real data
  const recentActivity = staffId ? await prisma.$transaction([
    // Recent meetings created or updated
    prisma.meeting.findMany({
      where: {
        OR: [
          { organizer_id: staffId },
          {
            meeting_attendee: {
              some: {
                staff_id: staffId
              }
            }
          }
        ]
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 3,
      include: {
        staff: {
          include: {
            users: true
          }
        },
        _count: {
          select: {
            meeting_agenda_items: true,
            meeting_attendee: true
          }
        }
      }
    }),
    // Recent notes
    prisma.meeting_notes.findMany({
      where: {
        staff_id: staffId
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 3,
      include: {
        meeting: true
      }
    })
  ]) : [[], []];

  const quickStats = [
    { name: "Upcoming Meetings", value: stats[0], icon: Calendar },
    { name: "Organized Meetings", value: stats[1], icon: Users },
    { name: "Notes Created", value: stats[2], icon: FileText },
  ];

  return (
    <div className="max-w-full">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back, {user.name}</h1>
        {userWithStaff?.staff?.[0]?.school && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{userWithStaff.staff[0].school.name}</span>
            {userWithStaff.staff[0].school.address && (
              <>
                <span>•</span>
                <span>{userWithStaff.staff[0].school.address}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickStats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{stat.name}</h3>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* Left Column - Meetings */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Today's Meetings</h2>
            <a
              href="/dashboard/meetings"
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View all →
            </a>
          </div>
          
          <div className="space-y-4">
            {upcomingMeetings.slice(0, 4).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-xl hover:bg-card/60 transition-colors group"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {String(meeting.title)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {safeFormatDateTime(meeting.start_time as Date | null, undefined, 'No date set')}
                  </p>
                </div>
                <div className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full">
                  Scheduled
                </div>
              </div>
            ))}
            
            {upcomingMeetings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming meetings scheduled</p>
                <a
                  href="/dashboard/meetings"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 5h2v14h-2zM5 11h14v2H5z"/>
                  </svg>
                  Schedule Meeting
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Right Column - Activity Summary */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            {/* Recent Meetings Activity */}
            {recentActivity[0].length > 0 ? (
              recentActivity[0].map((meeting) => (
                <div key={meeting.id} className="p-4 bg-background/30 rounded-lg border border-border/30">
                  <p className="font-medium text-foreground mb-1">{meeting.title}</p>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                    <li>• {meeting._count.MeetingAgendaItems} agenda items</li>
                    <li>• {meeting._count.MeetingAttendee} attendees</li>
                    <li>• Organized by {meeting.staff.users.name ?? meeting.staff.users.email}</li>
                  </ul>
                  <div className="text-xs text-muted-foreground mt-3 text-right">
                    {meeting.created_at ? new Date(meeting.created_at).toLocaleString() : 'Recently'}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                <p className="text-sm text-muted-foreground text-center">No recent meeting activity</p>
              </div>
            )}

            {/* Recent Notes Activity */}
            {recentActivity[1].length > 0 && (
              <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                <p className="font-medium text-foreground mb-1">Recent Notes</p>
                <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                  {recentActivity[1].slice(0, 3).map((note) => (
                    <li key={note.id}>• Note for: {note.meeting.title}</li>
                  ))}
                </ul>
                <div className="text-xs text-muted-foreground mt-3 text-right">
                  {recentActivity[1][0].created_at ? new Date(recentActivity[1][0].created_at).toLocaleString() : 'Recently'}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-border/30">
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Quick Actions</h3>
            <div className="space-y-3">
              <a 
                href="/dashboard/meetings" 
                className="flex items-center gap-3 p-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group"
              >
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary">Create Meeting</span>
              </a>
              <a 
                href="/dashboard/notes" 
                className="flex items-center gap-3 p-3 bg-background/30 hover:bg-background/50 rounded-lg transition-colors group"
              >
                <FileText className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Add Notes</span>
              </a>
              <a 
                href="/dashboard/team" 
                className="flex items-center gap-3 p-3 bg-background/30 hover:bg-background/50 rounded-lg transition-colors group"
              >
                <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">View Team</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 
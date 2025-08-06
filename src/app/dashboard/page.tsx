import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Calendar, Users, FileText } from "lucide-react";
import { isUserAdmin } from "@/lib/auth/admin-check";

export default async function DashboardPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  // Check if any district exists
  const districtCount = await prisma.district.count();
  
  // Get user with staff information first
  const userWithStaff = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      Staff: {
        include: {
          Role: true,
          Department: true,
          School: true
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Waiting for Setup
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while an administrator sets up the district.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const userId = userWithStaff?.id;
  
  if (!userId) {
    redirect("/auth/signin");
  }
  
  // Fetch upcoming meetings for the user
  const upcomingMeetings = await prisma.meeting.findMany({
    where: {
      OR: [
        { organizer_id: userId },
        {
          MeetingAttendee: {
            some: {
              Staff: {
                user_id: userId
              },
              status: "ACCEPTED",
            },
          },
        },
      ],
      start_time: {
        gte: new Date(),
      },
    },
    include: {
      Staff: {
        include: {
          User: true
        }
      },
      MeetingAttendee: {
        include: {
          Staff: {
            include: {
              User: true
            }
          }
        },
      },
    },
    orderBy: {
      start_time: "asc",
    },
    take: 5,
  });

  // Fetch quick stats
  const stats = await prisma.$transaction([
    prisma.meeting.count({
      where: {
        start_time: {
          gte: new Date(),
        },
        OR: [
          { organizer_id: userId },
          {
            MeetingAttendee: {
              some: {
                Staff: {
                  user_id: userId
                },
                status: "ACCEPTED",
              },
            },
          },
        ],
      },
    }),
    prisma.meeting.count({
      where: {
        organizer_id: userId,
      },
    }),
    prisma.meetingNote.count({
      where: {
        Staff: {
          user_id: userId,
        },
      },
    }),
  ]);

  const quickStats = [
    { name: "Upcoming Meetings", value: stats[0], icon: Calendar },
    { name: "Organized Meetings", value: stats[1], icon: Users },
    { name: "Notes Created", value: stats[2], icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="space-y-6">
            {userWithStaff?.Staff?.[0]?.School && (
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-lg font-medium text-gray-900">{userWithStaff.Staff[0].School.name}</h2>
                {userWithStaff.Staff[0].School.address && (
                  <p className="text-sm text-gray-500 mt-1">
                    {userWithStaff.Staff[0].School.address}
                  </p>
                )}
              </div>
            )}
            
            <h1 className="text-2xl font-bold">Welcome back, {user.name}</h1>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickStats.map((stat) => (
                <div
                  key={stat.name}
                  className="bg-white p-6 rounded-lg shadow-sm border"
                >
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-50">
                      <stat.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Upcoming Meetings */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
                <a
                  href="/dashboard/meetings"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all
                </a>
              </div>
              <div className="grid gap-4">
                {upcomingMeetings.map((meeting: any) => (
                  <div
                    key={meeting.id}
                    className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{meeting.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {meeting.start_time ? new Date(meeting.start_time).toLocaleString() : 'No date set'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 
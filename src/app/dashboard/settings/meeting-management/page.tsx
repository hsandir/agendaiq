import React from 'react';
import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { safeFormatDateTime } from '@/lib/utils/safe-date';

export default async function MeetingManagementDashboard() {
  const user = await requireAuth(AuthPresets.requireAuth);

  const userDetails = await prisma.user.findUnique({
    where: { email: user.email },
    include: { 
      Staff: {
        include: {
          Role: true
        }
      }
    }
  });

  if (!userDetails || (userDetails.Staff?.[0]?.Role?.title !== "Administrator")) {
    redirect("/dashboard");
  }

  // Fetch all meetings for admin view
  const meetings = await prisma.meeting.findMany({
    include: {
      Staff: {
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      MeetingAttendee: {
        include: {
          Staff: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      start_time: "desc",
    },
  });

  const currentTime = new Date();
  const upcomingMeetings = meetings.filter(m => m.start_time && m.start_time > currentTime);
  const pastMeetings = meetings.filter(m => m.start_time && m.start_time <= currentTime);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Staff Meeting Management</h1>
      <div className="mb-4 p-4 bg-primary border border-blue-200 rounded-lg">
        <p className="text-sm text-primary">
          <strong>Admin Only:</strong> This page allows administrators to view and manage all staff meetings across the organization.
        </p>
      </div>
      
      <section className="mb-6">
        <Link 
          href="/dashboard/meetings/new"
          className="px-4 py-2 bg-primary text-foreground rounded hover:bg-primary"
        >
          Create New Meeting
        </Link>
      </section>
      
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Upcoming Meetings ({upcomingMeetings.length})</h2>
        {upcomingMeetings.length > 0 ? (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date/Time</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Organizer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendees</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {upcomingMeetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{meeting.title}</div>
                      {meeting.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">{meeting.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-foreground">
                      {safeFormatDateTime(meeting.start_time, undefined, 'TBD')}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-foreground">
                      {meeting.Staff.User.name || meeting.Staff.User.email}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-foreground">
                      {meeting.MeetingAttendee.length} attendees
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/meetings/${meeting.id}`} className="text-primary hover:text-primary mr-3">
                        View
                      </Link>
                      {/* TODO: Add zoom_join_url field to Meeting model
                      {meeting.zoom_join_url && (
                        <a 
                          href={meeting.zoom_join_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          Join
                        </a>
                      )} */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border p-4 rounded bg-muted">No upcoming meetings scheduled.</div>
        )}
      </section>
      
      <section>
        <h2 className="text-lg font-semibold mb-2">Meeting History ({pastMeetings.length})</h2>
        {pastMeetings.length > 0 ? (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date/Time</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Organizer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendees</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {pastMeetings.slice(0, 10).map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{meeting.title}</div>
                      {meeting.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">{meeting.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-foreground">
                      {safeFormatDateTime(meeting.start_time, undefined, 'TBD')}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-foreground">
                      {meeting.Staff.User.name || meeting.Staff.User.email}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-foreground">
                      {meeting.MeetingAttendee.length} attendees
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/meetings/${meeting.id}`} className="text-primary hover:text-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border p-4 rounded bg-muted">No past meetings yet.</div>
        )}
      </section>
    </div>
  );
} 
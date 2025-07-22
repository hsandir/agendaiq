import React from 'react';
import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MeetingManagementDashboard() {
  const user = await requireAuth(AuthPresets.requireAuth);

  const userDetails = await prisma.user.findUnique({
    where: { email: user.email },
    include: { 
      staff: {
        include: {
          role: true
        }
      }
    }
  });

  if (!userDetails || userDetails.staff?.[0]?.role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  // Fetch all meetings for admin view
  const meetings = await prisma.meeting.findMany({
    include: {
      organizer: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      attendees: {
        include: {
          staff: {
            include: {
              user: {
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
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Admin Only:</strong> This page allows administrators to view and manage all staff meetings across the organization.
        </p>
      </div>
      
      <section className="mb-6">
        <Link 
          href="/dashboard/meetings/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Meeting
        </Link>
      </section>
      
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Upcoming Meetings ({upcomingMeetings.length})</h2>
        {upcomingMeetings.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingMeetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                      {meeting.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{meeting.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.start_time ? new Date(meeting.start_time).toLocaleString() : 'TBD'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.organizer.user.name || meeting.organizer.user.email}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.attendees.length} attendees
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/meetings/${meeting.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </Link>
                      {meeting.zoom_join_url && (
                        <a 
                          href={meeting.zoom_join_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          Join
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border p-4 rounded bg-gray-50">No upcoming meetings scheduled.</div>
        )}
      </section>
      
      <section>
        <h2 className="text-lg font-semibold mb-2">Meeting History ({pastMeetings.length})</h2>
        {pastMeetings.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastMeetings.slice(0, 10).map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                      {meeting.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{meeting.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.start_time ? new Date(meeting.start_time).toLocaleString() : 'TBD'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.organizer.user.name || meeting.organizer.user.email}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.attendees.length} attendees
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/meetings/${meeting.id}`} className="text-blue-600 hover:text-blue-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border p-4 rounded bg-gray-50">No past meetings yet.</div>
        )}
      </section>
    </div>
  );
} 
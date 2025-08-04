import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { MeetingDetails } from "@/components/meetings/MeetingDetails";
import { ArrowLeft, Edit2, Video, Users } from "lucide-react";
import Link from "next/link";
import { respondToMeeting } from "./actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: PageProps) {
  const user = await requireAuth(AuthPresets.requireAuth);

  const { id } = await params;

  // Convert string ID to integer for Prisma
  const meetingId = parseInt(id);
  if (isNaN(meetingId)) {
    redirect("/dashboard/meetings");
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
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
        }
      },
      Department: true,
      School: true,
      District: true
    },
  });

  if (!meeting) {
    redirect("/dashboard/meetings");
  }

  // Get current user's staff record
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email || "" },
    include: {
      Staff: true
    }
  });

  const userStaffId = currentUser?.Staff?.[0]?.id;
  const userAttendee = meeting.MeetingAttendee.find(
    (a) => a.staff_id === userStaffId
  );
  const isOrganizer = meeting.organizer_id === userStaffId;
  const canRespond = userAttendee && userAttendee.status === "pending";

  // Transform the meeting data to match the component interface
  const transformedMeeting = {
    id: meeting.id.toString(),
    title: meeting.title,
    description: meeting.description || undefined,
    startTime: meeting.start_time?.toISOString() || new Date().toISOString(),
    endTime: meeting.end_time?.toISOString() || new Date().toISOString(),
    zoomLink: meeting.zoom_join_url || undefined,
    status: meeting.status || "draft",
    organizer: {
      id: meeting.Staff.User.id,
      name: meeting.Staff.User.name,
      email: meeting.Staff.User.email
    },
    attendees: meeting.MeetingAttendee.map(attendee => ({
      id: attendee.id.toString(),
      status: attendee.status,
      staff: {
        user: {
          id: attendee.Staff.User.id,
          name: attendee.Staff.User.name,
          email: attendee.Staff.User.email
        }
      }
    })),
    isOrganizer: Boolean(isOrganizer)
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/meetings"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-1 h-5 w-5" />
              Back to Meetings
            </Link>
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
          </div>
          <div className="flex items-center space-x-3">
            {/* Join Live Button - Show for all attendees and organizer */}
            {(isOrganizer || userAttendee) && (
              <Link
                href={`/dashboard/meetings/${meeting.id}/live`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Users className="mr-2 h-5 w-5" />
                Join Live Meeting
              </Link>
            )}
            {canRespond && (
              <>
                <form action={async () => {
                  "use server";
                  await respondToMeeting(meeting.id.toString(), "ACCEPTED");
                }}>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Accept
                  </button>
                </form>
                <form action={async () => {
                  "use server";
                  await respondToMeeting(meeting.id.toString(), "DECLINED");
                }}>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Decline
                  </button>
                </form>
              </>
            )}
            {isOrganizer && (
              <Link
                href={`/dashboard/meetings/${meeting.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit2 className="mr-2 h-5 w-5" />
                Edit Meeting
              </Link>
            )}
          </div>
        </div>

        <MeetingDetails
          meeting={transformedMeeting}
          isOrganizer={Boolean(isOrganizer)}
          canRespond={Boolean(canRespond)}
          onRespond={async (status: "ACCEPTED" | "DECLINED") => {
            "use server";
            await respondToMeeting(meeting.id.toString(), status);
          }}
        />
      </div>
    </div>
  );
} 
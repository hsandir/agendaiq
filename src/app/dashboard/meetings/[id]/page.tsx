import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

  // Check if user has access to this meeting
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      MeetingAttendee: {
        where: { staff_id: user.staff?.id || -1 }
      }
    }
  });

  if (!meeting) {
    redirect("/dashboard/meetings");
  }

  // Check permissions
  const isOrganizer = meeting.organizer_id === user.staff?.id;
  const isAttendee = meeting.MeetingAttendee.length > 0;
  const isAdmin = user.staff?.role?.title === 'Administrator';

  if (!isOrganizer && !isAttendee && !isAdmin) {
    redirect("/dashboard/meetings");
  }

  // Redirect to live meeting page
  redirect(`/dashboard/meetings/${meetingId}/live`);
} 
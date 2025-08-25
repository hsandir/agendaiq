import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAnyAdmin } from '@/lib/auth/policy';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: PageProps) {
  const user = await requireAuth(AuthPresets.requireAuth);

  // Safely resolve params
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    redirect("/dashboard/meetings");
  }

  // Convert string ID to integer for Prisma
  const meetingId = parseInt(id);
  if (isNaN(meetingId)) {
    redirect("/dashboard/meetings");
  }

  // Check if user has access to this meeting
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      meeting_attendee: {
        where: { staff_id: user.staff?.id || -1 }
      }
    }
  });

  if (!meeting) {
    redirect("/dashboard/meetings");
  }

  // Check permissions
  const isOrganizer = meeting.organizer_id === user.staff?.id;
  const isAttendee = meeting.meeting_attendee.length > 0;
  const hasAdminAccess = isAnyAdmin(user);

  if (!isOrganizer && !isAttendee && !hasAdminAccess) {
    redirect("/dashboard/meetings");
  }

  // Redirect to live meeting page
  redirect(`/dashboard/meetings/${meetingId}/live`);
} 
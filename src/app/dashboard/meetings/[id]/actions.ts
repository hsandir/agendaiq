"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function respondToMeeting(
  meetingId: string,
  status: "ACCEPTED" | "DECLINED"
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }

  // Convert string meeting ID to integer
  const meetingIdInt = parseInt(meetingId);
  if (isNaN(meetingIdInt)) {
    throw new Error("Invalid meeting ID");
  }

  // Get current user's staff record
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      staff: true
    }
  });

  if (!currentUser || !currentUser.staff || currentUser.staff.length === 0) {
    throw new Error("User staff record not found");
  }

  const userStaffId = currentUser.staff[0].id;

  const attendee = await prisma.meetingAttendee.findFirst({
    where: {
      meeting_id: meetingIdInt,
      staff_id: userStaffId,
    },
  });

  if (!attendee) {
    throw new Error("Not invited to this meeting");
  }

  await prisma.meetingAttendee.update({
    where: {
      id: attendee.id,
    },
    data: {
      status,
    },
  });

  // Create audit log entry for attendee response
  await prisma.meetingAuditLog.create({
    data: {
      meeting_id: meetingIdInt,
      user_id: currentUser.id,
      action: status === "ACCEPTED" ? "joined" : "declined",
      details: {
        attendee_name: currentUser.name || currentUser.email,
        response: status
      }
    }
  });

  revalidatePath(`/dashboard/meetings/${meetingId}`);
  revalidatePath("/dashboard/meetings");
} 
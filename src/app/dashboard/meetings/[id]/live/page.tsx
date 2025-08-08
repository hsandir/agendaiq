import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MeetingLiveView } from "@/components/meetings/MeetingLiveView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MeetingLivePage(props: Props) {
  const params = await props.params;
  const user = await requireAuth(AuthPresets.requireStaff);
  
  const meetingId = parseInt(params.id);
  if (isNaN(meetingId)) {
    notFound();
  }

  // Fetch meeting with all related data
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      Department: true,
      District: true,
      School: true,
      Staff: {
        include: {
          User: true,
          Role: true
        }
      },
      MeetingAttendee: {
        include: {
          Staff: {
            include: {
              User: true,
              Role: true,
              Department: true
            }
          }
        }
      },
      MeetingAgendaItems: {
        include: {
          ResponsibleStaff: {
            include: {
              User: true
            }
          },
          Comments: {
            include: {
              Staff: {
                include: {
                  User: true
                }
              }
            }
          },
          ActionItems: {
            include: {
              AssignedTo: {
                include: {
                  User: true
                }
              }
            }
          }
        },
        orderBy: {
          order_index: 'asc'
        }
      },
      MeetingActionItems: {
        include: {
          AssignedTo: {
            include: {
              User: true,
              Role: true
            }
          }
        }
      }
    }
  });

  if (!meeting) {
    notFound();
  }

  // Check if user is authorized
  const isOrganizer = meeting.organizer_id === user.staff?.id;
  const isAttendee = meeting.MeetingAttendee.some(ma => ma.staff_id === user.staff?.id);
  const isAdmin = user.staff?.role.title === 'Administrator';

  if (!isOrganizer && !isAttendee && !isAdmin) {
    notFound();
  }

  // Get all staff for assignment dropdowns
  const allStaff = await prisma.staff.findMany({
    include: {
      User: true,
      Role: true,
      Department: true
    }
  });

  return (
    <div className="min-h-screen bg-muted">
      <MeetingLiveView
        meeting={meeting}
        currentUser={user}
        allStaff={allStaff}
        isOrganizer={isOrganizer}
        isAdmin={isAdmin}
      />
    </div>
  );
}
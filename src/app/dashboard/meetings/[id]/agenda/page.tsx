import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { MeetingFormStep2 } from "@/components/meetings/MeetingFormStep2";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MeetingAgendaPage(props: Props) {
  const params = await props.params;
  const user = await requireAuth(AuthPresets.requireStaff);
  
  const meetingId = parseInt(params.id);

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Meeting - Step 2</h1>
        <p className="text-gray-600">Add agenda items and configure meeting details</p>
      </div>
      
      <MeetingFormStep2 meetingId={meetingId} />
    </div>
  );
}
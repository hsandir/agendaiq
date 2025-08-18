'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  FileText, 
  Plus, 
  Edit, 
  Archive,
  UserPlus,
  Clock,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import AddMemberModal from '@/components/teams-v2/AddMemberModal';

interface TeamDetailClientProps {
  team: any;
  currentUserId: number;
  isLead: boolean;
}

export default function TeamDetailClient({ team, currentUserId, isLead }: TeamDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'notes' | 'meetings'>('overview');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleBack = () => {
    router.push('/dashboard/teams-v2');
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this team?')) return;

    try {
      const response = await fetch(`/api/teams-v2/${team.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/teams-v2');
      }
    } catch (error) {
      console.error('Error archiving team:', error);
    }
  };

  const getStatusBadge = () => {
    if (team.status === 'ACTIVE') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Archived</span>;
  };

  const getTypeBadge = () => {
    const colors = {
      EVENT: 'bg-purple-100 text-purple-800',
      PROJECT: 'bg-blue-100 text-blue-800',
      COMMITTEE: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[team.type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {team.type}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Teams</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              {getStatusBadge()}
              {getTypeBadge()}
              <span className="text-gray-500 flex items-center gap-1">
                <Building className="h-4 w-4" />
                {team.school.name}
              </span>
            </div>
          </div>

          {isLead && team.status === 'ACTIVE' && (
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Archive className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Members</p>
              <p className="text-2xl font-bold">{team._count.members}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Meetings</p>
              <p className="text-2xl font-bold">{team._count.meetings}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-2xl font-bold">{team._count.notes}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-lg font-bold">
                {team.end_date 
                  ? `${Math.ceil((new Date(team.end_date).getTime() - new Date(team.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                  : 'Ongoing'
                }
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Members
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {team.members.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {team.notes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'meetings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Meetings
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {team.meetings.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Purpose</h3>
              <p className="text-gray-600">{team.purpose}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Timeline</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Start Date:</span> {format(new Date(team.start_date), 'MMMM d, yyyy')}
                  </p>
                  {team.end_date && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">End Date:</span> {format(new Date(team.end_date), 'MMMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Created By</h3>
                <p className="text-sm text-gray-600">
                  {team.creator.name || team.creator.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(team.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Team Members</h3>
              {isLead && (
                <button
                  onClick={() => setIsAddingMember(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </button>
              )}
            </div>

            <div className="space-y-3">
              {team.members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.user.name || member.user.email}</p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'LEAD' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        Team Lead
                      </span>
                    )}
                    <p className="text-sm text-gray-500">
                      Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Team Notes</h3>
              <button
                onClick={() => setIsAddingNote(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </button>
            </div>

            {team.notes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No notes yet</p>
            ) : (
              <div className="space-y-4">
                {team.notes.map((note: any) => (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{note.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        note.category === 'MEETING_NOTE'
                          ? 'bg-blue-100 text-blue-800'
                          : note.category === 'DECISION'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {note.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{note.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{note.creator.name || note.creator.email}</span>
                      <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Team Meetings</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Calendar className="h-4 w-4" />
                Schedule Meeting
              </button>
            </div>

            {team.meetings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No meetings scheduled</p>
            ) : (
              <div className="space-y-3">
                {team.meetings.map((meeting: any) => (
                  <div key={meeting.id} className="border rounded-lg p-4">
                    <h4 className="font-medium">{meeting.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {meeting.start_time 
                          ? format(new Date(meeting.start_time), 'MMM d, yyyy h:mm a')
                          : 'Not scheduled'
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isAddingMember && (
        <AddMemberModal
          isOpen={isAddingMember}
          onClose={() => setIsAddingMember(false)}
          onSuccess={() => {
            setIsAddingMember(false);
            // Refresh the page to show new members
            window.location.reload();
          }}
          teamId={team.id}
          currentMembers={team.members.map((m: any) => m.user_id)}
        />
      )}
    </div>
  );
}
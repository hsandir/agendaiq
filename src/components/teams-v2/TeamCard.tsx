'use client';

import { Calendar, Users, FileText, Archive } from 'lucide-react';
import { format } from 'date-fns';

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    type: string;
    status: string;
    purpose: string;
    start_date: string;
    end_date?: string | null;
    _count: {
      members: number;
      meetings: number;
      notes: number;
    };
    school: {
      name: string;
    };
  };
  onClick?: () => void;
}

export default function TeamCard({ team, onClick }: TeamCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EVENT':
        return 'bg-purple-100 text-purple-800';
      case 'PROJECT':
        return 'bg-blue-100 text-blue-800';
      case 'COMMITTEE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{team.school.name}</p>
        </div>
        {team.status === 'ARCHIVED' && (
          <Archive className="h-5 w-5 text-gray-400" />
        )}
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(team.type)}`}>
          {team.type}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
          {team.status}
        </span>
      </div>

      {/* Purpose */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{team.purpose}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{team._count.members}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{team._count.meetings}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          <span>{team._count.notes}</span>
        </div>
      </div>

      {/* Dates */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Start: {format(new Date(team.start_date), 'MMM d, yyyy')}</span>
          {team.end_date && (
            <span>End: {format(new Date(team.end_date), 'MMM d, yyyy')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
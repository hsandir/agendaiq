'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import TeamCard from '@/components/teams-v2/TeamCard';
import CreateTeamModal from '@/components/teams-v2/CreateTeamModal';
import { useRouter } from 'next/navigation';

interface Team {
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
}

export default function TeamsPageClient({ userId, schoolId }: { userId: number; schoolId: number }) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [filter]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('status', filter);
      }
      
      const response = await fetch(`/api/teams-v2?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTeam = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchTeams(); // Refresh the teams list
  };

  const handleTeamClick = (teamId: string) => {
    // TODO: Navigate to team detail page
    router.push(`/dashboard/teams-v2/${teamId}`);
  };

  return (
    <div>
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* Filter Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'ACTIVE'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('ARCHIVED')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'ARCHIVED'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Archived
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateTeam}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Teams Grid */}
      {!loading && filteredTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => handleTeamClick(team.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Filter className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : filter === 'ARCHIVED'
              ? 'No archived teams yet'
              : 'Get started by creating your first team'}
          </p>
          {!searchTerm && filter !== 'ARCHIVED' && (
            <button
              onClick={handleCreateTeam}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Team</span>
            </button>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        schoolId={schoolId}
      />
    </div>
  );
}
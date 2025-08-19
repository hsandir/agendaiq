'use client';

import { useState, useEffect } from 'react';
import { X, Search, UserPlus } from 'lucide-react';

interface User {
  id: number;
  name: string | null;
  email: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  currentMembers: number[];
}

export default function AddMemberModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  teamId,
  currentMembers 
}: AddMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && searchTerm.length >= 2) {
      searchUsers();
    }
  }, [searchTerm, isOpen]);

  const searchUsers = async () => {
    setSearching(true);
    try {
      const response = await fetch(`/api/users?search=${searchTerm}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out current members
        const availableUsers = data.filter((u: User) => !currentMembers.includes(u.id));
        setUsers(availableUsers);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Add each selected user
      for (const userId of selectedUsers) {
        const response = await fetch(`/api/teams-v2/${teamId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, role: 'MEMBER' }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add member');
        }
      }

      onSuccess();
      onClose();
      setSelectedUsers([]);
      setSearchTerm('');
      setUsers([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Team Members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="mb-4 max-h-64 overflow-y-auto">
          {searching ? (
            <div className="text-center py-4 text-gray-500">Searching...</div>
          ) : searchTerm.length < 2 ? (
            <div className="text-center py-4 text-gray-500">
              Type at least 2 characters to search
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.includes(user.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      {user.name && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Count */}
        {selectedUsers.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading || selectedUsers.length === 0}
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Adding...' : 'Add Members'}
          </button>
        </div>
      </div>
    </div>
  );
}
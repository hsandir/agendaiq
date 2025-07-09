'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RoleSwitchProps {
  staff?: { Role: { id: number; title: string } | null } | null;
}

export function RoleSwitch({ staff }: RoleSwitchProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleId = Number(e.target.value);
    
    // Don't switch if already the current role
    if (selectedRoleId === staff?.Role?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to switch role');
      }

      console.log('Role switched successfully:', data);
      
      // Force a hard refresh to ensure all data is updated
      window.location.reload();
    } catch (error) {
      console.error('Error switching role:', error);
      setError(error instanceof Error ? error.message : 'Failed to switch role');
      // Reset the select to the original value on error
      e.target.value = staff?.Role?.id?.toString() || '';
    } finally {
      setIsLoading(false);
    }
  };

  // Determine current role - default to user if not admin
  const currentRoleKey = staff?.Role?.title === 'Administrator' ? 'admin' : 'user';

  return (
    <div className="flex items-center space-x-2">
      <select 
        name="role"
        value={staff?.Role?.id?.toString() || ''}
        onChange={handleRoleChange}
        disabled={isLoading}
        className="ml-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="">Select role</option>
        <option value={staff?.Role?.id?.toString() || ''}>{staff?.Role?.title || 'Current Role'}</option>
      </select>
      {isLoading && (
        <span className="text-xs text-gray-500">Switching...</span>
      )}
      {error && (
        <span className="text-xs text-red-500" title={error}>❌</span>
      )}
    </div>
  );
} 
import { Metadata } from 'next';
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import AuditLogsClient from './AuditLogsClient';

export const metadata: Metadata = {
  title: 'Audit Logs | AgendaIQ',
  description: 'Detailed records of database operations and system changes',
};

export default async function AuditLogsPage() {
  const user = await requireAuth(AuthPresets.requireAdmin);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Database Audit Logs</h1>
        <p className="text-gray-600 mt-1">
          Monitor all database operations, rollback changes, and track system modifications
        </p>
      </div>

      <AuditLogsClient />
    </div>
  );
} 
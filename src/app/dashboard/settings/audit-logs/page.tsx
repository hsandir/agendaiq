import { Metadata } from 'next';
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import AuditLogsClient from './AuditLogsClient';

export const metadata: Metadata = {
  title: 'Audit Logs | AgendaIQ',
  description: 'Detailed records of database operations and system changes',
};

export default async function AuditLogsPage() {
  const user = await requireAuth(AuthPresets.requireLogs);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Database Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Monitor all database operations, rollback changes, and track system modifications
        </p>
      </div>

      <AuditLogsClient user={{
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        staff: user.staff ? {
          id: user.staff.id,
          role: {
            title: user.staff.role?.title || 'Unknown',
            priority: user.staff.role?.priority || 0,
            is_leadership: user.staff.role?.is_leadership || false
          },
          department: {
            name: user.staff.department?.name || 'Unknown'
          }
        } : undefined
      }} />
    </div>
  );
} 
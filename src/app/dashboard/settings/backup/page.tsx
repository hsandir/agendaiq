import { Metadata } from "next";
import { requireAuth } from '@/lib/auth/auth-utils';
import { Capability } from '@/lib/auth/policy';
import BackupClient from './BackupClient';

export const metadata: Metadata = {
  title: "Backup & Restore | AgendaIQ",
  description: "Manage system backups and restore points with comprehensive backup functionality",
};

export default async function BackupPage() {
  // Auth control - only users with backup capability can access
  const user = await requireAuth({ requireAuth: true, requireCapability: Capability.OPS_BACKUP });

  // Initial backup data will be fetched by the client component
  // This ensures real-time data and proper error handling
  const initialBackupData = null;

  return <BackupClient initialBackupData={initialBackupData} />;
} 
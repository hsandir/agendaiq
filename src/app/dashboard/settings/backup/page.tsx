import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import BackupClient from './BackupClient';

export const metadata: Metadata = {
  title: "Backup & Restore | AgendaIQ",
  description: "Manage system backups and restore points with comprehensive backup functionality",
};

export default async function BackupPage() {
  // Auth control - only admins can access backup functionality
  const user = await requireAuth(AuthPresets.requireAdmin);

  // Initial backup data will be fetched by the client component
  // This ensures real-time data and proper error handling
  const initialBackupData = null;

  return <BackupClient initialBackupData={initialBackupData} />;
} 
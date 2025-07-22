import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import StaffUploadClient from './StaffUploadClient';

export const metadata: Metadata = {
  title: "Staff Upload | AgendaIQ",
  description: "Upload CSV files to bulk import or update staff records with comprehensive validation",
};

export default async function StaffUploadPage() {
  // REQUIRED: Server-side auth check - Leadership required
  const user = await requireAuth(AuthPresets.requireLeadership);

  return <StaffUploadClient />;
} 
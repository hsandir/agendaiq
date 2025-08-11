import { Metadata } from "next";
import { requireAuth } from '@/lib/auth/auth-utils';
import { Capability } from '@/lib/auth/policy';
import StaffUploadClient from './StaffUploadClient';

export const metadata: Metadata = {
  title: "Staff Upload | AgendaIQ",
  description: "Upload CSV files to bulk import or update staff records with comprehensive validation",
};

export default async function StaffUploadPage() {
  // REQUIRED: Server-side auth check - Staff import capability required
  const user = await requireAuth({ requireAuth: true, requireCapability: Capability.STAFF_IMPORT });

  return <StaffUploadClient />;
} 
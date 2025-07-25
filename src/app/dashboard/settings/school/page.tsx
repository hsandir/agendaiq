import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import SchoolClient from './SchoolClient';

export const metadata: Metadata = {
  title: "School Settings | AgendaIQ",
  description: "Manage school information and settings",
};

export default async function SchoolSettingsPage() {
  // Use new standardized auth system - only leadership can access school settings
  const user = await requireAuth(AuthPresets.requireLeadership);

  // Initial school data will be fetched by the client component
  // This ensures real-time data and proper error handling
  const initialSchool = null;

  return <SchoolClient initialSchool={initialSchool} />;
} 
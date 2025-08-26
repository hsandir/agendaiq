import { Metadata } from "next";
import { requireAuth } from '@/lib/auth/auth-utils';
import { Capability } from '@/lib/auth/policy';
import SchoolClient from './SchoolClient';

export const metadata: Metadata = {
  title: "School Settings | AgendaIQ",
  description: "Manage school information and settings",
};

export default async function SchoolSettingsPage() {
  // Use new standardized auth system - only those with school management capability
  const user = await requireAuth({ requireAuth: true, requireCapability: Capability.SCHOOL_MANAGE });

  // Initial school data will be fetched by the client component
  // This ensures real-time data and proper error handling
  const initialSchool = null;

  return <SchoolClient initialschool={initialSchool} />;
} 
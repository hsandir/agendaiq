import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import RoleHierarchyContent from './RoleHierarchyContent';

export const metadata: Metadata = {
  title: "Role Hierarchy | AgendaIQ",
  description: "View and manage organizational role hierarchy"
};

export default async function RoleHierarchyPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return <RoleHierarchyContent />;
}
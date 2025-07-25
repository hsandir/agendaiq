import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import UserRoleAssignmentContent from './UserRoleAssignmentContent';

export const metadata: Metadata = {
  title: "User Role Assignment | AgendaIQ",
  description: "Assign users to roles and departments"
};

export default async function UserRoleAssignmentPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return <UserRoleAssignmentContent />;
} 
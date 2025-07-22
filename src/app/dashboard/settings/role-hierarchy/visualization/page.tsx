import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import RoleHierarchyVisualizationContent from './RoleHierarchyVisualizationContent';

export const metadata: Metadata = {
  title: "Role Hierarchy Visualization | AgendaIQ",
  description: "Visualize and explore the organizational role hierarchy"
};

export default async function RoleHierarchyVisualizationPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return <RoleHierarchyVisualizationContent />;
} 
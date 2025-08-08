import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Eye as FiEye, Edit3 as FiEdit3, Users as FiUsers, TrendingUp as FiTrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: "Role Hierarchy | AgendaIQ",
  description: "Manage and visualize your organization's role structure"
};

// Convert to server component with client wrapper
import RoleHierarchyContent from './RoleHierarchyContent';

export default async function RoleHierarchyPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return <RoleHierarchyContent />;
} 
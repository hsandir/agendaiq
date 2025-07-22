import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiEye, FiEdit3, FiUsers, FiTrendingUp } from 'react-icons/fi';

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
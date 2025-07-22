'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiUsers, FiUser, FiShield, FiHome } from 'react-icons/fi';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
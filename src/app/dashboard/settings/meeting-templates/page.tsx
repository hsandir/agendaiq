import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/prisma';
import MeetingTemplatesClient from './MeetingTemplatesClient';

export const metadata: Metadata = {
  title: "Meeting Templates | AgendaIQ",
  description: "Manage meeting templates and scheduling rules for the organization",
};

export default async function MeetingTemplatesPage() {
  // Use standardized auth system - require admin for meeting templates
  const user = await requireAuth(AuthPresets.requireAdmin);

  // Fetch meeting templates from database
  const templates = await prisma.meetingTemplate.findMany({
    include: {
      Staff: {
        include: {
          User: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Fetch roles for attendee selection
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      title: true,
      is_leadership: true
    },
    orderBy: {
      title: 'asc'
    }
  });

  // Fetch departments for attendee selection
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <MeetingTemplatesClient 
      initialTemplates={templates}
      roles={roles}
      departments={departments}
    />
  );
} 
} 
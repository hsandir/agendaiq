/**
 * Type definitions for test factories
 * Following CLAUDE.md rules for type safety
 */

import { Prisma } from '@prisma/client'

// User factory types
export type UserCreateOverrides = Partial<
  Omit<Prisma.usersCreateInput, 'staff' | 'accounts' | 'sessions'> & {
    password?: string
  }
>

// Staff factory types
export type StaffCreateOverrides = Partial<
  Omit<Prisma.staffCreateInput, 'users' | 'role' | 'department' | 'school' | 'district'> & {
    user?: unknown // Will be User type from Prisma
    role?: unknown // Will be Role type from Prisma
    department?: unknown // Will be Department type from Prisma
    school?: unknown // Will be School type from Prisma
    district?: unknown // Will be District type from Prisma
  }
>

// Meeting factory types
export type MeetingCreateOverrides = Partial<
  Omit<Prisma.meetingCreateInput, 'created_by_staff' | 'department' | 'school' | 'meeting_attendee' | 'meeting_agenda_items' | 'meeting_attachments' | 'meeting_action_items' | 'meeting_decisions' | 'parent_meeting' | 'child_meetings'> & {
    createdByStaff?: unknown
    department?: unknown
    school?: unknown
  }
>

// Agenda item factory types
export type AgendaItemCreateOverrides = Partial<
  Omit<Prisma.meeting_agenda_itemsCreateInput, 'meeting' | 'presenter_staff' | 'responsible_staff' | 'meeting_action_items'> & {
    meeting?: unknown
    presenterStaff?: unknown
    responsibleStaff?: unknown
  }
>

// Department factory types
export type DepartmentCreateOverrides = Partial<
  Omit<Prisma.departmentCreateInput, 'school' | 'head_staff' | 'staff' | 'meeting'> & {
    school?: unknown
    headStaff?: unknown
  }
>

// School factory types
export type SchoolCreateOverrides = Partial<
  Omit<Prisma.schoolCreateInput, 'district' | 'principal_staff' | 'vice_principal_staff' | 'department' | 'staff' | 'meeting'> & {
    district?: unknown
    principalStaff?: unknown
    vicePrincipalStaff?: unknown
  }
>

// District factory types
export type DistrictCreateOverrides = Partial<
  Omit<Prisma.districtCreateInput, 'school' | 'staff'>
>

// Role factory types
export type RoleCreateOverrides = Partial<
  Omit<Prisma.roleCreateInput, 'staff' | 'role_hierarchy_parent_role' | 'role_hierarchy_child_role'>
>

// Generic factory response types
export type FactoryResponse<T> = T & {
  id: number
  created_at: Date
  updated_at: Date
}
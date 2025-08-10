/**
 * Type definitions for test factories
 * Following CLAUDE.md rules for type safety
 */

import { Prisma } from '@prisma/client'

// User factory types
export type UserCreateOverrides = Partial<
  Omit<Prisma.UserCreateInput, 'Staff' | 'accounts' | 'sessions'> & {
    password?: string
  }
>

// Staff factory types
export type StaffCreateOverrides = Partial<
  Omit<Prisma.StaffCreateInput, 'User' | 'Role' | 'Department' | 'School' | 'District'> & {
    user?: any // Will be User type from Prisma
    role?: any // Will be Role type from Prisma
    department?: any // Will be Department type from Prisma
    school?: any // Will be School type from Prisma
    district?: any // Will be District type from Prisma
  }
>

// Meeting factory types
export type MeetingCreateOverrides = Partial<
  Omit<Prisma.MeetingCreateInput, 'created_by_staff' | 'Department' | 'School' | 'attendees' | 'agenda_items' | 'attachments' | 'action_items' | 'decisions' | 'parent_meeting' | 'child_meetings'> & {
    createdByStaff?: any
    department?: any
    school?: any
  }
>

// Agenda item factory types
export type AgendaItemCreateOverrides = Partial<
  Omit<Prisma.AgendaItemCreateInput, 'Meeting' | 'presenter_staff' | 'responsible_staff' | 'action_items'> & {
    meeting?: any
    presenterStaff?: any
    responsibleStaff?: any
  }
>

// Department factory types
export type DepartmentCreateOverrides = Partial<
  Omit<Prisma.DepartmentCreateInput, 'School' | 'head_staff' | 'staff' | 'meetings'> & {
    school?: any
    headStaff?: any
  }
>

// School factory types
export type SchoolCreateOverrides = Partial<
  Omit<Prisma.SchoolCreateInput, 'District' | 'principal_staff' | 'vice_principal_staff' | 'departments' | 'staff' | 'meetings'> & {
    district?: any
    principalStaff?: any
    vicePrincipalStaff?: any
  }
>

// District factory types
export type DistrictCreateOverrides = Partial<
  Omit<Prisma.DistrictCreateInput, 'schools' | 'staff'>
>

// Role factory types
export type RoleCreateOverrides = Partial<
  Omit<Prisma.RoleCreateInput, 'staff' | 'parent_roles' | 'child_roles'>
>

// Generic factory response types
export type FactoryResponse<T> = T & {
  id: number
  created_at: Date
  updated_at: Date
}
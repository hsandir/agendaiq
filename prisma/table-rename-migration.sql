-- Table Renaming Migration for Consistency
-- This migration renames all PascalCase tables to snake_case
-- Run this AFTER the column addition migration

BEGIN;

-- Rename tables from PascalCase to snake_case
ALTER TABLE IF EXISTS "Account" RENAME TO accounts;
ALTER TABLE IF EXISTS "District" RENAME TO districts;
ALTER TABLE IF EXISTS "School" RENAME TO schools;
ALTER TABLE IF EXISTS "Department" RENAME TO departments;
ALTER TABLE IF EXISTS "Role" RENAME TO roles;
ALTER TABLE IF EXISTS "RoleHierarchy" RENAME TO role_hierarchies;
ALTER TABLE IF EXISTS "Permission" RENAME TO permissions;
ALTER TABLE IF EXISTS "Staff" RENAME TO staff;
ALTER TABLE IF EXISTS "Meeting" RENAME TO meetings;
ALTER TABLE IF EXISTS "MeetingAttendee" RENAME TO meeting_attendees;
ALTER TABLE IF EXISTS "Session" RENAME TO sessions;
ALTER TABLE IF EXISTS "SystemSetting" RENAME TO system_settings;
ALTER TABLE IF EXISTS "VerificationToken" RENAME TO verification_tokens;
ALTER TABLE IF EXISTS "MeetingActionItem" RENAME TO meeting_action_items;
ALTER TABLE IF EXISTS "MeetingTranscript" RENAME TO meeting_transcripts;
ALTER TABLE IF EXISTS "MeetingSearch" RENAME TO meeting_search;
ALTER TABLE IF EXISTS "RoleTransition" RENAME TO role_transitions;
ALTER TABLE IF EXISTS "DevLog" RENAME TO dev_logs;
ALTER TABLE IF EXISTS "SecurityLog" RENAME TO security_logs;

-- Note: Tables already in snake_case will not be affected:
-- users, meeting_notes, critical_audit_logs, audit_logs, meeting_templates,
-- devices, meeting_agenda_items, agenda_item_attachments, agenda_item_comments,
-- meeting_audit_logs, teams, team_members, team_knowledge

COMMIT;

-- Verification
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
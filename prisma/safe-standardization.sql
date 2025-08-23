-- SAFE Table Standardization Migration
-- This combines column additions AND table renaming in correct order
-- Date: 2025-08-23

BEGIN;

-- STEP 1: Add missing columns FIRST (using current table names)
-- ============================================================

-- 1.1 Add attended column to MeetingAttendee
ALTER TABLE "MeetingAttendee" 
ADD COLUMN IF NOT EXISTS "attended" BOOLEAN DEFAULT false;

-- 1.2 Add admin flags to users table (already snake_case)
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "is_system_admin" BOOLEAN DEFAULT false;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "is_school_admin" BOOLEAN DEFAULT false;

-- 1.3 Add location and zoom_link to Meeting table
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "location" TEXT;

ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "zoom_link" TEXT;

-- 1.4 Add key and label columns to Role table
ALTER TABLE "Role"
ADD COLUMN IF NOT EXISTS "key" TEXT;

ALTER TABLE "Role"
ADD COLUMN IF NOT EXISTS "label" TEXT;

-- 1.5 Create unique constraint on Role.key
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public'
    AND tablename = 'Role' 
    AND indexname = 'Role_key_key'
  ) THEN
    CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");
  END IF;
END $$;

-- 1.6 Update existing roles with their keys
UPDATE "Role" SET "key" = 'DEV_ADMIN' WHERE "title" = 'Developer Admin' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'OPS_ADMIN' WHERE "title" = 'Operations Admin' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'PRINCIPAL' WHERE "title" = 'Principal' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'VICE_PRINCIPAL' WHERE "title" = 'Vice Principal' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'DEAN' WHERE "title" = 'Dean' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'COORDINATOR' WHERE "title" = 'Coordinator' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'TEACHER' WHERE "title" = 'Teacher' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'STAFF' WHERE "title" = 'Staff' AND "key" IS NULL;

-- STEP 2: Rename tables to snake_case
-- ====================================
-- Foreign keys will automatically update due to CASCADE

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
ALTER TABLE IF EXISTS "MeetingSearch" RENAME TO meeting_search_entries;
ALTER TABLE IF EXISTS "RoleTransition" RENAME TO role_transitions;
ALTER TABLE IF EXISTS "DevLog" RENAME TO dev_logs;
ALTER TABLE IF EXISTS "SecurityLog" RENAME TO security_logs;
ALTER TABLE IF EXISTS "AgendaItemAttachment" RENAME TO agenda_item_attachments;
ALTER TABLE IF EXISTS "AgendaItemComment" RENAME TO agenda_item_comments;
ALTER TABLE IF EXISTS "MeetingAgendaItem" RENAME TO meeting_agenda_items;

-- STEP 3: Create Teams tables with snake_case references
-- =======================================================
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'PROJECT',
  status TEXT DEFAULT 'ACTIVE',
  purpose TEXT NOT NULL,
  start_date TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP(3),
  is_recurring BOOLEAN DEFAULT false,
  budget DECIMAL(10,2),
  school_id INTEGER,
  department_id INTEGER,
  district_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP(3),
  parent_team_id TEXT,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (parent_team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  staff_id INTEGER,
  role TEXT DEFAULT 'MEMBER',
  joined_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP(3),
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_knowledge (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'NOTE',
  visibility TEXT DEFAULT 'TEAM',
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for Teams tables
CREATE INDEX IF NOT EXISTS teams_school_id_status_idx ON teams(school_id, status);
CREATE INDEX IF NOT EXISTS teams_type_status_idx ON teams(type, status);
CREATE INDEX IF NOT EXISTS teams_created_by_idx ON teams(created_by);
CREATE INDEX IF NOT EXISTS team_members_user_id_is_active_idx ON team_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);
CREATE INDEX IF NOT EXISTS team_knowledge_team_id_category_idx ON team_knowledge(team_id, category);
CREATE INDEX IF NOT EXISTS team_knowledge_visibility_idx ON team_knowledge(visibility);

COMMIT;

-- STEP 4: Verification
-- ====================
SELECT 
  'Tables after migration:' as info,
  string_agg(table_name, ', ' ORDER BY table_name) as all_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Check specific renamed tables
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings')
    THEN '✓ meetings table exists'
    ELSE '✗ meetings table missing'
  END as status
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles')
    THEN '✓ roles table exists'
    ELSE '✗ roles table missing'
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff')
    THEN '✓ staff table exists'
    ELSE '✗ staff table missing'
  END;
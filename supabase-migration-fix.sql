-- AgendaIQ Production Database Schema Fix
-- Date: 2025-08-23
-- Purpose: Add missing columns that exist in local but not in production

-- IMPORTANT: Run this in Supabase SQL Editor
-- Make sure to backup your database before running this migration

BEGIN;

-- 1. Add attended column to MeetingAttendee (for tracking actual attendance)
ALTER TABLE "MeetingAttendee" 
ADD COLUMN IF NOT EXISTS "attended" BOOLEAN DEFAULT false;

-- 2. Add admin flags to users table (critical for authorization)
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "is_system_admin" BOOLEAN DEFAULT false;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "is_school_admin" BOOLEAN DEFAULT false;

-- 3. Add location and zoom_link to Meeting table
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "location" TEXT;

ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "zoom_link" TEXT;

-- 4. Add key column to Role table (critical for RoleKey system)
ALTER TABLE "Role"
ADD COLUMN IF NOT EXISTS "key" TEXT;

-- 5. Create unique constraint on Role.key
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

-- 6. Create Teams tables if they don't exist
CREATE TABLE IF NOT EXISTS "teams" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "code" TEXT UNIQUE NOT NULL,
  "type" TEXT DEFAULT 'PROJECT',
  "status" TEXT DEFAULT 'ACTIVE',
  "purpose" TEXT NOT NULL,
  "start_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "end_date" TIMESTAMP(3),
  "is_recurring" BOOLEAN DEFAULT false,
  "budget" DECIMAL(10,2),
  "school_id" INTEGER,
  "department_id" INTEGER,
  "district_id" INTEGER,
  "created_by" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "archived_at" TIMESTAMP(3),
  "parent_team_id" TEXT,
  FOREIGN KEY ("school_id") REFERENCES "School"("id"),
  FOREIGN KEY ("department_id") REFERENCES "Department"("id"),
  FOREIGN KEY ("district_id") REFERENCES "District"("id"),
  FOREIGN KEY ("created_by") REFERENCES "users"("id"),
  FOREIGN KEY ("parent_team_id") REFERENCES "teams"("id")
);

CREATE TABLE IF NOT EXISTS "team_members" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_id" TEXT NOT NULL,
  "user_id" INTEGER NOT NULL,
  "staff_id" INTEGER,
  "role" TEXT DEFAULT 'MEMBER',
  "joined_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "left_at" TIMESTAMP(3),
  "is_active" BOOLEAN DEFAULT true,
  FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("staff_id") REFERENCES "Staff"("id"),
  UNIQUE("team_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "team_knowledge" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT DEFAULT 'NOTE',
  "visibility" TEXT DEFAULT 'TEAM',
  "created_by" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE,
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
);

-- Create indexes for Teams tables
CREATE INDEX IF NOT EXISTS "teams_school_id_status_idx" ON "teams"("school_id", "status");
CREATE INDEX IF NOT EXISTS "teams_type_status_idx" ON "teams"("type", "status");
CREATE INDEX IF NOT EXISTS "teams_created_by_idx" ON "teams"("created_by");
CREATE INDEX IF NOT EXISTS "team_members_user_id_is_active_idx" ON "team_members"("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members"("team_id");
CREATE INDEX IF NOT EXISTS "team_knowledge_team_id_category_idx" ON "team_knowledge"("team_id", "category");
CREATE INDEX IF NOT EXISTS "team_knowledge_visibility_idx" ON "team_knowledge"("visibility");

-- 7. Update existing roles with their keys if not set
UPDATE "Role" SET "key" = 'DEV_ADMIN' WHERE "title" = 'Developer Admin' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'OPS_ADMIN' WHERE "title" = 'Operations Admin' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'PRINCIPAL' WHERE "title" = 'Principal' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'VICE_PRINCIPAL' WHERE "title" = 'Vice Principal' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'DEAN' WHERE "title" = 'Dean' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'COORDINATOR' WHERE "title" = 'Coordinator' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'TEACHER' WHERE "title" = 'Teacher' AND "key" IS NULL;
UPDATE "Role" SET "key" = 'STAFF' WHERE "title" = 'Staff' AND "key" IS NULL;

COMMIT;

-- Verification queries (run these after migration to confirm):
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'MeetingAttendee' AND column_name = 'attended';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('is_system_admin', 'is_school_admin');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'Meeting' AND column_name IN ('location', 'zoom_link');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'Role' AND column_name = 'key';
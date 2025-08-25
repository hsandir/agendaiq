-- SUPABASE DATABASE MIGRATION SCRIPT
-- From PascalCase to snake_case table names
-- CRITICAL: RUN ONLY AFTER FULL BACKUP

BEGIN;

-- Step 1: Rename PascalCase tables to snake_case
-- This preserves all data while updating table names

ALTER TABLE "Account" RENAME TO "account";
ALTER TABLE "Department" RENAME TO "department";
ALTER TABLE "District" RENAME TO "district";
ALTER TABLE "Meeting" RENAME TO "meeting";
ALTER TABLE "MeetingAttendee" RENAME TO "meeting_attendee";
ALTER TABLE "Permission" RENAME TO "permission";
ALTER TABLE "Role" RENAME TO "role";
ALTER TABLE "RoleHierarchy" RENAME TO "role_hierarchy";
ALTER TABLE "School" RENAME TO "school";
ALTER TABLE "Session" RENAME TO "session";
ALTER TABLE "Staff" RENAME TO "staff";
ALTER TABLE "SystemSetting" RENAME TO "system_setting";
ALTER TABLE "VerificationToken" RENAME TO "verification_token";

-- Step 2: Create missing tables that exist in local but not in Supabase

-- Create system_settings table
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" SERIAL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "value_type" TEXT DEFAULT 'string',
    "category" TEXT DEFAULT 'general',
    "description" TEXT,
    "is_public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for system_settings
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_key_key" ON "system_settings" ("key");
CREATE INDEX IF NOT EXISTS "idx_system_settings_category" ON "system_settings" ("category");
CREATE INDEX IF NOT EXISTS "idx_system_settings_key" ON "system_settings" ("key");

-- Create team_knowledge_views table
CREATE TABLE IF NOT EXISTS "team_knowledge_views" (
    "id" SERIAL PRIMARY KEY,
    "knowledge_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "viewed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes and foreign keys for team_knowledge_views
CREATE INDEX IF NOT EXISTS "idx_team_knowledge_views_knowledge_id" ON "team_knowledge_views" ("knowledge_id");
CREATE INDEX IF NOT EXISTS "idx_team_knowledge_views_user_id" ON "team_knowledge_views" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "team_knowledge_views_knowledge_id_user_id_key" ON "team_knowledge_views" ("knowledge_id", "user_id");

-- Add foreign key constraints (will be added after table renames are complete)
-- ALTER TABLE "team_knowledge_views" ADD CONSTRAINT "team_knowledge_views_knowledge_id_fkey" 
--     FOREIGN KEY ("knowledge_id") REFERENCES "team_knowledge"("id") ON DELETE CASCADE;
-- ALTER TABLE "team_knowledge_views" ADD CONSTRAINT "team_knowledge_views_user_id_fkey" 
--     FOREIGN KEY ("user_id") REFERENCES "users"("id");

-- Step 3: Verify all tables exist after migration
SELECT 'MIGRATION_VERIFICATION' as status, 
       COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List all tables to verify snake_case naming
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

COMMIT;

-- If any errors occur, run: ROLLBACK;
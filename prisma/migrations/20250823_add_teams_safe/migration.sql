-- CreateTable for Teams feature (Safe - won't break existing system)
-- All new tables, no modifications to existing ones

-- Team main table (mapped to 'teams' in database)
CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PROJECT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "purpose" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "budget" DECIMAL(10, 2),
    "school_id" INTEGER,
    "department_id" INTEGER,
    "district_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),
    "parent_team_id" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- Team members junction table (mapped to 'team_members' in database)
CREATE TABLE IF NOT EXISTS "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "staff_id" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- Team knowledge/notes table (mapped to 'team_knowledge' in database)
CREATE TABLE IF NOT EXISTS "team_knowledge" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'NOTE',
    "visibility" TEXT NOT NULL DEFAULT 'TEAM',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_knowledge_pkey" PRIMARY KEY ("id")
);

-- Add team_id to meetings table (NULLABLE - safe addition)
-- This won't break existing meetings
ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "team_id" TEXT;

-- CreateIndex for performance
CREATE UNIQUE INDEX IF NOT EXISTS "teams_code_key" ON "teams"("code");
CREATE INDEX IF NOT EXISTS "teams_school_id_status_idx" ON "teams"("school_id", "status");
CREATE INDEX IF NOT EXISTS "teams_type_status_idx" ON "teams"("type", "status");
CREATE INDEX IF NOT EXISTS "teams_created_by_idx" ON "teams"("created_by");

CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");
CREATE INDEX IF NOT EXISTS "team_members_user_id_is_active_idx" ON "team_members"("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members"("team_id");

CREATE INDEX IF NOT EXISTS "team_knowledge_team_id_category_idx" ON "team_knowledge"("team_id", "category");
CREATE INDEX IF NOT EXISTS "team_knowledge_visibility_idx" ON "team_knowledge"("visibility");

CREATE INDEX IF NOT EXISTS "Meeting_team_id_idx" ON "Meeting"("team_id");

-- AddForeignKey (All are safe - reference existing tables)
ALTER TABLE "teams" ADD CONSTRAINT "Team_school_id_fkey" 
    FOREIGN KEY ("school_id") REFERENCES "School"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "teams" ADD CONSTRAINT "Team_department_id_fkey" 
    FOREIGN KEY ("department_id") REFERENCES "Department"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "teams" ADD CONSTRAINT "Team_district_id_fkey" 
    FOREIGN KEY ("district_id") REFERENCES "District"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "teams" ADD CONSTRAINT "Team_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teams" ADD CONSTRAINT "Team_parent_team_id_fkey" 
    FOREIGN KEY ("parent_team_id") REFERENCES "teams"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "team_members" ADD CONSTRAINT "TeamMember_team_id_fkey" 
    FOREIGN KEY ("team_id") REFERENCES "teams"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members" ADD CONSTRAINT "TeamMember_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members" ADD CONSTRAINT "TeamMember_staff_id_fkey" 
    FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "team_knowledge" ADD CONSTRAINT "TeamKnowledge_team_id_fkey" 
    FOREIGN KEY ("team_id") REFERENCES "teams"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_knowledge" ADD CONSTRAINT "TeamKnowledge_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_team_id_fkey" 
    FOREIGN KEY ("team_id") REFERENCES "teams"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
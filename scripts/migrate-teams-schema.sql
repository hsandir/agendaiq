-- Migration Script: Modernize Teams Schema
-- This script updates the teams schema to support the new UI while maintaining backward compatibility

BEGIN;

-- Step 1: Add new columns to teams table if they don't exist
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Step 2: Update existing teams with default metadata
UPDATE teams 
SET metadata = jsonb_build_object(
    'purpose', purpose,
    'goals', 'Improve collaboration and productivity',
    'visibility', CASE WHEN status = 'ACTIVE' THEN 'public' ELSE 'private' END,
    'auto_add_new_staff', false,
    'require_approval', true,
    'notification_preferences', jsonb_build_object(
        'new_member', true,
        'new_resource', true,
        'member_left', true,
        'resource_updated', false,
        'weekly_digest', true
    ),
    'permissions', jsonb_build_object(
        'members_can_add', false,
        'members_can_remove', false,
        'members_can_edit_resources', true,
        'members_can_delete_resources', false
    )
)
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- Step 3: Update teams description from purpose if not set
UPDATE teams 
SET description = purpose 
WHERE description IS NULL;

-- Step 4: Update is_active based on status
UPDATE teams 
SET is_active = CASE WHEN status = 'ACTIVE' THEN true ELSE false END
WHERE is_active IS NULL;

-- Step 5: Add new columns to team_knowledge table if they don't exist
ALTER TABLE team_knowledge 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by_staff_id INTEGER;

-- Step 6: Update team_knowledge visibility mapping
UPDATE team_knowledge 
SET is_public = CASE 
    WHEN visibility = 'PUBLIC' THEN true 
    ELSE false 
END;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);
CREATE INDEX IF NOT EXISTS idx_teams_type ON teams(type);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_team_id ON team_knowledge(team_id);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_type ON team_knowledge(type);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_is_public ON team_knowledge(is_public);

-- Step 8: Add foreign key for created_by_staff_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'team_knowledge_created_by_staff_id_fkey'
    ) THEN
        ALTER TABLE team_knowledge 
        ADD CONSTRAINT team_knowledge_created_by_staff_id_fkey 
        FOREIGN KEY (created_by_staff_id) 
        REFERENCES staff(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 9: Update created_by_staff_id from created_by (user_id)
UPDATE team_knowledge tk
SET created_by_staff_id = s.id
FROM staff s
WHERE tk.created_by = s.user_id
AND tk.created_by_staff_id IS NULL;

-- Step 10: Create view for backward compatibility
CREATE OR REPLACE VIEW teams_legacy AS
SELECT 
    id,
    name,
    code,
    type,
    status,
    purpose,
    start_date,
    end_date,
    is_recurring,
    budget,
    school_id,
    department_id,
    district_id,
    created_by,
    created_at,
    updated_at,
    description,
    is_active,
    metadata
FROM teams;

-- Step 11: Create view for new schema compatibility
CREATE OR REPLACE VIEW teams_modern AS
SELECT 
    id,
    name,
    COALESCE(description, purpose) as description,
    type,
    is_active,
    created_at,
    updated_at,
    metadata,
    (SELECT COUNT(*) FROM team_members WHERE team_id = teams.id) as member_count,
    (SELECT COUNT(*) FROM team_knowledge WHERE team_id = teams.id) as knowledge_count
FROM teams;

-- Step 12: Create a function to handle both old and new API calls
CREATE OR REPLACE FUNCTION get_team_data(team_id TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'description', COALESCE(t.description, t.purpose),
        'type', t.type,
        'is_active', t.is_active,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'metadata', t.metadata,
        -- Legacy fields
        'code', t.code,
        'status', t.status,
        'purpose', t.purpose,
        'start_date', t.start_date,
        'end_date', t.end_date,
        'is_recurring', t.is_recurring,
        'budget', t.budget,
        'school_id', t.school_id,
        'department_id', t.department_id,
        'district_id', t.district_id,
        'created_by', t.created_by,
        -- Counts
        '_count', jsonb_build_object(
            'team_members', (SELECT COUNT(*) FROM team_members WHERE team_id = t.id),
            'team_knowledge', (SELECT COUNT(*) FROM team_knowledge WHERE team_id = t.id)
        )
    ) INTO result
    FROM teams t
    WHERE t.id = team_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verification queries (run these to check the migration)
-- SELECT COUNT(*) FROM teams WHERE metadata IS NOT NULL;
-- SELECT COUNT(*) FROM teams WHERE is_active IS NOT NULL;
-- SELECT COUNT(*) FROM team_knowledge WHERE views_count >= 0;
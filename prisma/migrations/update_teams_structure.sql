-- Add missing columns to teams table if they don't exist
DO $$ 
BEGIN
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'description') THEN
        ALTER TABLE teams ADD COLUMN description TEXT;
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'is_active') THEN
        ALTER TABLE teams ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'metadata') THEN
        ALTER TABLE teams ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Add department_id index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON teams(department_id);

-- Ensure team_knowledge_views table exists (it might not have been created yet)
CREATE TABLE IF NOT EXISTS team_knowledge_views (
    id SERIAL PRIMARY KEY,
    knowledge_id INTEGER NOT NULL REFERENCES team_knowledge(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(knowledge_id, user_id)
);

-- Create indexes for team_knowledge_views if they don't exist
CREATE INDEX IF NOT EXISTS idx_team_knowledge_views_knowledge_id ON team_knowledge_views(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_views_user_id ON team_knowledge_views(user_id);
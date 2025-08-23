-- Create team_knowledge_views table with correct data types
CREATE TABLE IF NOT EXISTS team_knowledge_views (
    id SERIAL PRIMARY KEY,
    knowledge_id TEXT NOT NULL REFERENCES team_knowledge(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(knowledge_id, user_id)
);

-- Create indexes for team_knowledge_views
CREATE INDEX IF NOT EXISTS idx_team_knowledge_views_knowledge_id ON team_knowledge_views(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_views_user_id ON team_knowledge_views(user_id);

-- Add missing columns to team_knowledge if they don't exist
DO $$ 
BEGIN
    -- Add type column if it doesn't exist (rename from category)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_knowledge' AND column_name = 'type') THEN
        ALTER TABLE team_knowledge ADD COLUMN type TEXT DEFAULT 'NOTE';
    END IF;

    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_knowledge' AND column_name = 'tags') THEN
        ALTER TABLE team_knowledge ADD COLUMN tags TEXT[];
    END IF;

    -- Add url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_knowledge' AND column_name = 'url') THEN
        ALTER TABLE team_knowledge ADD COLUMN url TEXT;
    END IF;

    -- Add is_pinned column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_knowledge' AND column_name = 'is_pinned') THEN
        ALTER TABLE team_knowledge ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_knowledge' AND column_name = 'metadata') THEN
        ALTER TABLE team_knowledge ADD COLUMN metadata JSONB;
    END IF;
END $$;
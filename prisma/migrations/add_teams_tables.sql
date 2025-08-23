-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'DEPARTMENT',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    school_id INTEGER REFERENCES school(id),
    district_id INTEGER REFERENCES district(id),
    department_id INTEGER REFERENCES department(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_school_id ON teams(school_id);
CREATE INDEX IF NOT EXISTS idx_teams_district_id ON teams(district_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    staff_id INTEGER NOT NULL REFERENCES staff(id),
    role VARCHAR(50) DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, staff_id)
);

-- Create indexes for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_staff_id ON team_members(staff_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- Create team_knowledge table
CREATE TABLE IF NOT EXISTS team_knowledge (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'NOTE',
    tags TEXT[],
    url TEXT,
    is_pinned BOOLEAN DEFAULT false,
    metadata JSONB,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for team_knowledge
CREATE INDEX IF NOT EXISTS idx_team_knowledge_team_id ON team_knowledge(team_id);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_created_by ON team_knowledge(created_by);

-- Create team_knowledge_views table
CREATE TABLE IF NOT EXISTS team_knowledge_views (
    id SERIAL PRIMARY KEY,
    knowledge_id INTEGER NOT NULL REFERENCES team_knowledge(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(knowledge_id, user_id)
);

-- Create indexes for team_knowledge_views
CREATE INDEX IF NOT EXISTS idx_team_knowledge_views_knowledge_id ON team_knowledge_views(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_views_user_id ON team_knowledge_views(user_id);

-- Add updated_at trigger for teams
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_team_knowledge_updated_at BEFORE UPDATE ON team_knowledge
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
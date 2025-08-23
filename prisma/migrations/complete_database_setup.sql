-- =============================================
-- COMPLETE DATABASE SETUP FOR AGENDAIQ
-- =============================================

-- 1. AGENDA ITEM ATTACHMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS agenda_item_attachments (
    id SERIAL PRIMARY KEY,
    agenda_item_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agenda_item_id) REFERENCES meeting_agenda_items(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_agenda_item_attachments_agenda_item_id ON agenda_item_attachments(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_item_attachments_uploaded_by ON agenda_item_attachments(uploaded_by);

-- 2. AGENDA ITEM COMMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS agenda_item_comments (
    id SERIAL PRIMARY KEY,
    agenda_item_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agenda_item_id) REFERENCES meeting_agenda_items(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_agenda_item_comments_agenda_item_id ON agenda_item_comments(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_item_comments_staff_id ON agenda_item_comments(staff_id);

-- 3. SYSTEM SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    value_type TEXT DEFAULT 'string',
    category TEXT DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- 4. ROLE TRANSITIONS
-- =============================================
CREATE TABLE IF NOT EXISTS role_transitions (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    from_role_id INTEGER,
    to_role_id INTEGER NOT NULL,
    reason TEXT,
    approved_by INTEGER,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (from_role_id) REFERENCES role(id),
    FOREIGN KEY (to_role_id) REFERENCES role(id),
    FOREIGN KEY (approved_by) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_role_transitions_staff_id ON role_transitions(staff_id);
CREATE INDEX IF NOT EXISTS idx_role_transitions_effective_date ON role_transitions(effective_date);

-- 5. UPDATE TEAMS TABLE - Add missing columns
-- =============================================
DO $$ 
BEGIN
    -- Add description column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'description') THEN
        ALTER TABLE teams ADD COLUMN description TEXT;
    END IF;

    -- Add is_active column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'is_active') THEN
        ALTER TABLE teams ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add metadata column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'metadata') THEN
        ALTER TABLE teams ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- 6. UPDATE MEETING TABLE - Ensure all required columns exist
-- =============================================
DO $$ 
BEGIN
    -- Add team_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'team_id') THEN
        ALTER TABLE meeting ADD COLUMN team_id TEXT REFERENCES teams(id);
    END IF;

    -- Add template_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'template_id') THEN
        ALTER TABLE meeting ADD COLUMN template_id INTEGER REFERENCES meeting_templates(id);
    END IF;

    -- Add parent_meeting_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'parent_meeting_id') THEN
        ALTER TABLE meeting ADD COLUMN parent_meeting_id INTEGER REFERENCES meeting(id);
    END IF;

    -- Add series_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'series_id') THEN
        ALTER TABLE meeting ADD COLUMN series_id TEXT;
    END IF;

    -- Add series_position column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'series_position') THEN
        ALTER TABLE meeting ADD COLUMN series_position INTEGER;
    END IF;

    -- Add zoom_link column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'zoom_link') THEN
        ALTER TABLE meeting ADD COLUMN zoom_link TEXT;
    END IF;

    -- Add location column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'location') THEN
        ALTER TABLE meeting ADD COLUMN location TEXT;
    END IF;

    -- Add repeat_pattern column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'repeat_pattern') THEN
        ALTER TABLE meeting ADD COLUMN repeat_pattern TEXT;
    END IF;

    -- Add repeat_until column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'repeat_until') THEN
        ALTER TABLE meeting ADD COLUMN repeat_until DATE;
    END IF;

    -- Add repeat_weekdays column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meeting' AND column_name = 'repeat_weekdays') THEN
        ALTER TABLE meeting ADD COLUMN repeat_weekdays INTEGER[] DEFAULT '{}';
    END IF;
END $$;

-- 7. MEETING INTELLIGENCE TABLES
-- =============================================

-- Meeting Search (if not exists)
CREATE TABLE IF NOT EXISTS meeting_search (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER NOT NULL REFERENCES meeting(id) ON DELETE CASCADE,
    search_vector tsvector,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_search_meeting_id ON meeting_search(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_search_vector ON meeting_search USING GIN(search_vector);

-- Meeting Transcripts (if not exists)
CREATE TABLE IF NOT EXISTS meeting_transcripts (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER UNIQUE NOT NULL REFERENCES meeting(id) ON DELETE CASCADE,
    transcript TEXT,
    summary TEXT,
    key_points TEXT[],
    action_items TEXT[],
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting_id ON meeting_transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_processed ON meeting_transcripts(processed);

-- 8. ADD MISSING INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON teams(department_id);
CREATE INDEX IF NOT EXISTS idx_meeting_team_id ON meeting(team_id);
CREATE INDEX IF NOT EXISTS idx_meeting_template_id ON meeting(template_id);
CREATE INDEX IF NOT EXISTS idx_meeting_parent_meeting_id ON meeting(parent_meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_series_id ON meeting(series_id);

-- 9. UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- 10. VERIFY CRITICAL RELATIONSHIPS
-- =============================================
DO $$
BEGIN
    -- Ensure Meeting-Team relationship exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'meeting_team_id_fkey'
    ) THEN
        ALTER TABLE meeting 
        ADD CONSTRAINT meeting_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
    END IF;

    -- Ensure TeamMember-Staff relationship exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'team_members_staff_id_fkey'
    ) THEN
        ALTER TABLE team_members 
        ADD CONSTRAINT team_members_staff_id_fkey 
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
END $$;
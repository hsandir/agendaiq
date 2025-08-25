-- Fix team_members with proper user_id
DELETE FROM team_members WHERE team_id LIKE 'team-%';

-- Add team members with both staff_id and user_id
INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', s.user_id, s.id, 'LEAD', '2024-01-15 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 10;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', s.user_id, s.id, 'MEMBER', '2024-01-16 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 11;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', s.user_id, s.id, 'MEMBER', '2024-01-17 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 12;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', s.user_id, s.id, 'LEAD', '2024-02-01 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 11;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', s.user_id, s.id, 'MEMBER', '2024-02-02 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 13;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', s.user_id, s.id, 'MEMBER', '2024-02-03 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 14;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', s.user_id, s.id, 'LEAD', '2024-03-01 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 12;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', s.user_id, s.id, 'MEMBER', '2024-03-02 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 15;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', s.user_id, s.id, 'MEMBER', '2024-03-03 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 16;

-- Final status check
SELECT 'SUCCESS: Team members added with proper IDs' as status;

-- Show final complete summary
SELECT 
    t.name as team_name,
    t.code,
    COUNT(DISTINCT tm.staff_id) as members,
    COUNT(DISTINCT m.id) as meetings,
    COUNT(DISTINCT mai.id) as agenda_items,
    COUNT(DISTINCT ma.staff_id) as unique_attendees,
    COUNT(DISTINCT mn.id) as meeting_notes,
    COUNT(DISTINCT tk.id) as knowledge_resources,
    STRING_AGG(DISTINCT u.name, ', ') as member_names
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN users u ON tm.user_id = u.id
LEFT JOIN meeting m ON t.id = m.team_id  
LEFT JOIN meeting_agenda_items mai ON m.id = mai.meeting_id
LEFT JOIN meeting_attendee ma ON m.id = ma.meeting_id
LEFT JOIN meeting_notes mn ON m.id = mn.meeting_id
LEFT JOIN team_knowledge tk ON t.id = tk.team_id
WHERE t.id LIKE 'team-%'
GROUP BY t.id, t.name, t.code
ORDER BY t.name;
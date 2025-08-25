-- Fix team_members and agenda_items missing data
-- Add team members with proper IDs
INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', s.id, 'LEAD', '2024-01-15 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 10 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-curr-dev' AND tm.staff_id = s.id);

INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', s.id, 'MEMBER', '2024-01-16 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 11 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-curr-dev' AND tm.staff_id = s.id);

INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', s.id, 'MEMBER', '2024-01-17 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 12 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-curr-dev' AND tm.staff_id = s.id);

INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', s.id, 'LEAD', '2024-02-01 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 11 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-tech-int' AND tm.staff_id = s.id);

INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', s.id, 'MEMBER', '2024-02-02 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 13 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-tech-int' AND tm.staff_id = s.id);

INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', s.id, 'MEMBER', '2024-02-03 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 14 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-tech-int' AND tm.staff_id = s.id);

INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', s.id, 'LEAD', '2024-03-01 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 12 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-wellness' AND tm.staff_id = s.id);

INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', s.id, 'MEMBER', '2024-03-02 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 15 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-wellness' AND tm.staff_id = s.id);

INSERT INTO team_members (id, team_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', s.id, 'MEMBER', '2024-03-03 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 16 
AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = 'team-wellness' AND tm.staff_id = s.id);

-- Add agenda items with proper updated_at
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at) 
SELECT m.id, 'Math Standards Alignment Review', 'Current math curriculum needs alignment with new state standards', 
       s.id, 'Discussion', 'Resolved', 1, '2024-03-10 10:00:00'::timestamp, '2024-03-15 16:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 11
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Math Standards Alignment Review');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'English Language Arts Updates', 'ELA curriculum requires updates for next academic year',
       s.id, 'Decision', 'Resolved', 2, '2024-03-10 10:00:00'::timestamp, '2024-03-15 16:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 12
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'English Language Arts Updates');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Assessment Strategy Discussion', 'Need to update assessment methodologies across all subjects',
       s.id, 'Discussion', 'Pending', 3, '2024-03-10 10:00:00'::timestamp, '2024-03-10 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 10
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Assessment Strategy Discussion');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'New Lab Equipment Integration', 'New laboratory equipment needs integration into science curriculum',
       s.id, 'Decision', 'Resolved', 1, '2024-04-15 10:00:00'::timestamp, '2024-04-20 12:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Science Curriculum Update Planning' AND s.user_id = 11
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'New Lab Equipment Integration');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Teacher Training Schedule', 'Science teachers need professional development on new standards',
       s.id, 'Information_Sharing', 'Ongoing', 2, '2024-04-15 10:00:00'::timestamp, '2024-04-15 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Science Curriculum Update Planning' AND s.user_id = 12
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Teacher Training Schedule');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Learning Management System Review', 'District needs to select and implement a comprehensive LMS',
       s.id, 'Decision', 'Resolved', 1, '2024-03-20 10:00:00'::timestamp, '2024-03-25 15:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 11
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Learning Management System Review');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Digital Citizenship Curriculum', 'Students need comprehensive digital citizenship education',
       s.id, 'Discussion', 'Ongoing', 2, '2024-03-20 10:00:00'::timestamp, '2024-03-20 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 13
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Digital Citizenship Curriculum');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Network Infrastructure Assessment', 'Assess current network capacity for increased technology use',
       s.id, 'Information_Sharing', 'Resolved', 3, '2024-03-20 10:00:00'::timestamp, '2024-03-25 15:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 14
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Network Infrastructure Assessment');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Device Distribution Strategy', 'Need systematic approach for distributing devices across grade levels',
       s.id, 'Decision', 'Resolved', 1, '2024-05-05 10:00:00'::timestamp, '2024-05-10 11:30:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = '1:1 Device Rollout Planning' AND s.user_id = 11
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Device Distribution Strategy');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Tech Support Training', 'Staff need training to support 1:1 device initiative',
       s.id, 'Information_Sharing', 'Ongoing', 2, '2024-05-05 10:00:00'::timestamp, '2024-05-05 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = '1:1 Device Rollout Planning' AND s.user_id = 13
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Tech Support Training');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Counselor Staffing Review', 'Current counseling staff capacity may be insufficient for student needs',
       s.id, 'Discussion', 'Resolved', 1, '2024-04-01 10:00:00'::timestamp, '2024-04-05 13:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id = 12
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Counselor Staffing Review');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Wellness Program Activities', 'Students need structured wellness activities and stress reduction programs',
       s.id, 'Information_Sharing', 'Ongoing', 2, '2024-04-01 10:00:00'::timestamp, '2024-04-01 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id = 15
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Wellness Program Activities');

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Parent Communication Strategy', 'Develop communication plan for parent engagement in wellness initiatives',
       s.id, 'Discussion', 'Pending', 3, '2024-04-01 10:00:00'::timestamp, '2024-04-01 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id = 16
AND NOT EXISTS (SELECT 1 FROM meeting_agenda_items mai WHERE mai.meeting_id = m.id AND mai.topic = 'Parent Communication Strategy');

-- Add more knowledge resources
INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', 'Assessment Best Practices',
    'Collection of research-backed assessment methodologies and implementation strategies. Includes formative and summative assessment techniques.',
    'DOCUMENT', ARRAY['assessment', 'best-practices', 'evaluation'], 
    u.id, s.id, false, 8, 1, 
    '2024-02-10 10:00:00'::timestamp, '2024-02-10 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 11 AND s.user_id = u.id
AND NOT EXISTS (SELECT 1 FROM team_knowledge tk WHERE tk.team_id = 'team-curr-dev' AND tk.title = 'Assessment Best Practices');

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', 'Digital Citizenship Resources',
    'Collection of resources for teaching digital citizenship and online safety to students. Includes age-appropriate curricula and assessment tools.',
    'TEMPLATE', ARRAY['digital-citizenship', 'safety', 'resources'], 
    u.id, s.id, false, 12, 5, 
    '2024-03-01 10:00:00'::timestamp, '2024-03-01 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 13 AND s.user_id = u.id
AND NOT EXISTS (SELECT 1 FROM team_knowledge tk WHERE tk.team_id = 'team-tech-int' AND tk.title = 'Digital Citizenship Resources');

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', 'Crisis Intervention Procedures',
    'Step-by-step procedures for handling student mental health crises including emergency contacts and intervention strategies.',
    'GUIDE', ARRAY['crisis', 'intervention', 'mental-health'], 
    u.id, s.id, true, 25, 8, 
    '2024-03-15 10:00:00'::timestamp, '2024-03-15 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 15 AND s.user_id = u.id
AND NOT EXISTS (SELECT 1 FROM team_knowledge tk WHERE tk.team_id = 'team-wellness' AND tk.title = 'Crisis Intervention Procedures');

-- Final comprehensive summary
SELECT 'COMPLETED: All teams data fixed and enhanced' as status;

SELECT 
    'Team Members Added' as item, 
    COUNT(*) as count 
FROM team_members 
WHERE team_id LIKE 'team-%'
UNION ALL 
SELECT 
    'Agenda Items Added' as item, 
    COUNT(*) as count 
FROM meeting_agenda_items mai
JOIN meeting m ON mai.meeting_id = m.id 
WHERE m.team_id LIKE 'team-%'
UNION ALL
SELECT 
    'Knowledge Resources Total' as item, 
    COUNT(*) as count 
FROM team_knowledge 
WHERE team_id LIKE 'team-%';

-- Show final team overview with all data
SELECT 
    t.name as team_name,
    t.code,
    COUNT(DISTINCT tm.staff_id) as members,
    COUNT(DISTINCT m.id) as meetings,
    COUNT(DISTINCT mai.id) as agenda_items,
    COUNT(DISTINCT ma.staff_id) as total_attendees,
    COUNT(DISTINCT mn.id) as meeting_notes,
    COUNT(DISTINCT tk.id) as knowledge_resources
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN meeting m ON t.id = m.team_id  
LEFT JOIN meeting_agenda_items mai ON m.id = mai.meeting_id
LEFT JOIN meeting_attendee ma ON m.id = ma.meeting_id
LEFT JOIN meeting_notes mn ON m.id = mn.meeting_id
LEFT JOIN team_knowledge tk ON t.id = tk.team_id
WHERE t.id LIKE 'team-%'
GROUP BY t.id, t.name, t.code
ORDER BY t.name;
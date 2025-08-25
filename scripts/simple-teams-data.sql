-- Simple Teams Data Creation
-- Clean existing data first
DELETE FROM team_knowledge WHERE team_id LIKE 'team-%';
DELETE FROM meeting_notes WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id LIKE 'team-%');
DELETE FROM meeting_attendee WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id LIKE 'team-%');
DELETE FROM meeting_agenda_items WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id LIKE 'team-%');
DELETE FROM meeting WHERE team_id LIKE 'team-%';
DELETE FROM team_members WHERE team_id LIKE 'team-%';
DELETE FROM teams WHERE id LIKE 'team-%';

-- Team 1: Curriculum Development Team
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-curr-dev', 'Curriculum Development Team', 'CURR-DEV', 'Responsible for developing and updating curriculum standards across all grade levels', 'To ensure our curriculum meets state standards and student learning objectives', 10, '2024-01-15 10:00:00'::timestamp, '2024-01-15 10:00:00'::timestamp);

-- Team 2: Technology Integration Team  
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-tech-int', 'Technology Integration Team', 'TECH-INT', 'Leading digital transformation and technology integration in education', 'To implement and optimize technology solutions for enhanced learning experiences', 11, '2024-02-01 09:00:00'::timestamp, '2024-02-01 09:00:00'::timestamp);

-- Team 3: Student Wellness Committee
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-wellness', 'Student Wellness Committee', 'WELLNESS', 'Focused on student mental health, physical wellness, and overall well-being', 'To develop and implement comprehensive wellness programs for student success', 12, '2024-03-01 11:00:00'::timestamp, '2024-03-01 11:00:00'::timestamp);

-- Add team members
INSERT INTO team_members (team_id, staff_id, role, joined_at)
SELECT 'team-curr-dev', s.id, 'LEAD', '2024-01-15 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 10
UNION ALL
SELECT 'team-curr-dev', s.id, 'MEMBER', '2024-01-16 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 11 LIMIT 1
UNION ALL
SELECT 'team-curr-dev', s.id, 'MEMBER', '2024-01-17 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 12 LIMIT 1;

INSERT INTO team_members (team_id, staff_id, role, joined_at)
SELECT 'team-tech-int', s.id, 'LEAD', '2024-02-01 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 11 LIMIT 1
UNION ALL
SELECT 'team-tech-int', s.id, 'MEMBER', '2024-02-02 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 13 LIMIT 1
UNION ALL
SELECT 'team-tech-int', s.id, 'MEMBER', '2024-02-03 09:00:00'::timestamp
FROM staff s WHERE s.user_id = 14 LIMIT 1;

INSERT INTO team_members (team_id, staff_id, role, joined_at)
SELECT 'team-wellness', s.id, 'LEAD', '2024-03-01 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 12 LIMIT 1
UNION ALL
SELECT 'team-wellness', s.id, 'MEMBER', '2024-03-02 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 15 LIMIT 1
UNION ALL
SELECT 'team-wellness', s.id, 'MEMBER', '2024-03-03 11:00:00'::timestamp
FROM staff s WHERE s.user_id = 16 LIMIT 1;

-- Create meetings
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, team_id, status, created_at) 
SELECT 'Q1 Curriculum Standards Review', 'Quarterly review of curriculum standards alignment with state requirements', 
       '2024-03-15 14:00:00'::timestamp, '2024-03-15 16:00:00'::timestamp, 
       s.id, 2, 2, 'team-curr-dev', 'COMPLETED', '2024-03-10 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 10 LIMIT 1;

INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, team_id, status, created_at)
SELECT 'Science Curriculum Update Planning', 'Planning session for integrating new science standards for grades 6-12',
       '2024-04-20 10:00:00'::timestamp, '2024-04-20 12:00:00'::timestamp,
       s.id, 2, 2, 'team-curr-dev', 'COMPLETED', '2024-04-15 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 10 LIMIT 1;

INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, team_id, status, created_at)
SELECT 'EdTech Platform Evaluation', 'Evaluation of new educational technology platforms for school-wide implementation',
       '2024-03-25 13:00:00'::timestamp, '2024-03-25 15:00:00'::timestamp,
       s.id, 3, 2, 'team-tech-int', 'COMPLETED', '2024-03-20 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 11 LIMIT 1;

INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, team_id, status, created_at)
SELECT '1:1 Device Rollout Planning', 'Planning for 1:1 device implementation across all grade levels',
       '2024-05-10 09:00:00'::timestamp, '2024-05-10 11:30:00'::timestamp,
       s.id, 3, 2, 'team-tech-int', 'COMPLETED', '2024-05-05 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 11 LIMIT 1;

INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, team_id, status, created_at)
SELECT 'Mental Health Support Program Launch', 'Planning launch of comprehensive mental health support program for students',
       '2024-04-05 11:00:00'::timestamp, '2024-04-05 13:00:00'::timestamp,
       s.id, 4, 2, 'team-wellness', 'COMPLETED', '2024-04-01 10:00:00'::timestamp
FROM staff s WHERE s.user_id = 12 LIMIT 1;

-- Create agenda items
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at) 
SELECT m.id, 'Math Standards Alignment Review', 'Current math curriculum needs alignment with new state standards', 
       s.id, 'Discussion', 'Resolved', 1, '2024-03-10 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 11 LIMIT 1;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'English Language Arts Updates', 'ELA curriculum requires updates for next academic year',
       s.id, 'Decision', 'Resolved', 2, '2024-03-10 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 12 LIMIT 1;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Learning Management System Review', 'District needs to select and implement a comprehensive LMS',
       s.id, 'Decision', 'Resolved', 1, '2024-03-20 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 11 LIMIT 1;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Digital Citizenship Curriculum', 'Students need comprehensive digital citizenship education',
       s.id, 'Discussion', 'Ongoing', 2, '2024-03-20 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 13 LIMIT 1;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Counselor Staffing Review', 'Current counseling staff capacity may be insufficient for student needs',
       s.id, 'Discussion', 'Resolved', 1, '2024-04-01 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id = 12 LIMIT 1;

-- Add meeting attendees
INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id IN (10, 11, 12);

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id IN (11, 13, 14);

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id IN (12, 15, 16);

-- Add meeting notes
INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'Great discussion on math standards alignment. Action items assigned to team members.', '2024-03-15 15:30:00'::timestamp
FROM meeting m, staff s
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 10 LIMIT 1;

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'LMS evaluation complete. Recommendation to proceed with Canvas implementation district-wide.', '2024-03-25 14:30:00'::timestamp
FROM meeting m, staff s
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 11 LIMIT 1;

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'Mental health support program approved. Additional counselor positions approved.', '2024-04-05 12:30:00'::timestamp
FROM meeting m, staff s
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id = 12 LIMIT 1;

-- Add team knowledge resources (with proper UUID generation)
INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', 'State Curriculum Standards Guide', 
    'Comprehensive guide to state curriculum standards and alignment requirements for all subjects.',
    'GUIDE', ARRAY['curriculum', 'standards', 'alignment'], 
    u.id, s.id, true, 15, 3, 
    '2024-01-20 10:00:00'::timestamp, '2024-01-20 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 10 AND s.user_id = u.id LIMIT 1;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-curr-dev', 'Assessment Best Practices',
    'Collection of research-backed assessment methodologies and implementation strategies.',
    'DOCUMENT', ARRAY['assessment', 'best-practices', 'evaluation'],
    u.id, s.id, false, 8, 1,
    '2024-02-10 10:00:00'::timestamp, '2024-02-10 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 11 AND s.user_id = u.id LIMIT 1;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', 'EdTech Platform Comparison',
    'Detailed comparison of educational technology platforms including features, pricing, and implementation requirements.',
    'DOCUMENT', ARRAY['technology', 'platforms', 'comparison', 'LMS'],
    u.id, s.id, true, 22, 7,
    '2024-02-15 10:00:00'::timestamp, '2024-02-15 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 11 AND s.user_id = u.id LIMIT 1;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-tech-int', 'Digital Citizenship Resources',
    'Collection of resources for teaching digital citizenship and online safety to students.',
    'TEMPLATE', ARRAY['digital-citizenship', 'safety', 'resources'],
    u.id, s.id, false, 12, 5,
    '2024-03-01 10:00:00'::timestamp, '2024-03-01 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 13 AND s.user_id = u.id LIMIT 1;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', 'Student Wellness Program Framework',
    'Comprehensive framework for implementing student wellness programs including mental health support.',
    'POLICY', ARRAY['wellness', 'mental-health', 'framework'],
    u.id, s.id, true, 18, 4,
    '2024-03-05 10:00:00'::timestamp, '2024-03-05 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 12 AND s.user_id = u.id LIMIT 1;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-wellness', 'Crisis Intervention Procedures',
    'Step-by-step procedures for handling student mental health crises.',
    'GUIDE', ARRAY['crisis', 'intervention', 'mental-health', 'emergency'],
    u.id, s.id, true, 25, 8,
    '2024-03-15 10:00:00'::timestamp, '2024-03-15 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = 15 AND s.user_id = u.id LIMIT 1;

-- Final summary
SELECT 
    'SUCCESS: Created comprehensive teams data' as status,
    (SELECT COUNT(*) FROM teams WHERE id LIKE 'team-%') as teams_created,
    (SELECT COUNT(*) FROM team_members WHERE team_id LIKE 'team-%') as members_added,
    (SELECT COUNT(*) FROM meeting WHERE team_id LIKE 'team-%') as meetings_created,
    (SELECT COUNT(*) FROM meeting_agenda_items WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id LIKE 'team-%')) as agenda_items,
    (SELECT COUNT(*) FROM team_knowledge WHERE team_id LIKE 'team-%') as knowledge_resources;
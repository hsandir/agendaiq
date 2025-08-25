-- Sample Teams Data with Meetings and Agenda Items (Final Version)
-- Clean existing data first
DELETE FROM team_knowledge WHERE team_id LIKE 'team-%';
DELETE FROM meeting_notes WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL);
DELETE FROM meeting_attendee WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL);
DELETE FROM meeting_agenda_items WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL);
DELETE FROM meeting WHERE team_id IS NOT NULL;
DELETE FROM team_members WHERE team_id LIKE 'team-%';
DELETE FROM teams WHERE id LIKE 'team-%';

-- Team 1: Curriculum Development Team
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-curr-dev', 'Curriculum Development Team', 'CURR-DEV', 'Responsible for developing and updating curriculum standards across all grade levels', 'To ensure our curriculum meets state standards and student learning objectives', 10, '2024-01-15 10:00:00', '2024-01-15 10:00:00');

-- Team 2: Technology Integration Team  
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-tech-int', 'Technology Integration Team', 'TECH-INT', 'Leading digital transformation and technology integration in education', 'To implement and optimize technology solutions for enhanced learning experiences', 11, '2024-02-01 09:00:00', '2024-02-01 09:00:00');

-- Team 3: Student Wellness Committee
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-wellness', 'Student Wellness Committee', 'WELLNESS', 'Focused on student mental health, physical wellness, and overall well-being', 'To develop and implement comprehensive wellness programs for student success', 12, '2024-03-01 11:00:00', '2024-03-01 11:00:00');

-- Get staff IDs for team members
-- Add team members for Team 1 (Curriculum Development)
INSERT INTO team_members (team_id, staff_id, role, joined_at)
SELECT 'team-curr-dev', s.id, 'LEAD', '2024-01-15 10:00:00'
FROM staff s WHERE s.user_id = 10
UNION ALL
SELECT 'team-curr-dev', s.id, 'MEMBER', '2024-01-16 10:00:00'
FROM staff s WHERE s.user_id = 11
UNION ALL
SELECT 'team-curr-dev', s.id, 'MEMBER', '2024-01-17 10:00:00'
FROM staff s WHERE s.user_id = 12;

-- Add team members for Team 2 (Technology Integration)
INSERT INTO team_members (team_id, staff_id, role, joined_at)
SELECT 'team-tech-int', s.id, 'LEAD', '2024-02-01 09:00:00'
FROM staff s WHERE s.user_id = 11
UNION ALL
SELECT 'team-tech-int', s.id, 'MEMBER', '2024-02-02 09:00:00'
FROM staff s WHERE s.user_id = 13
UNION ALL
SELECT 'team-tech-int', s.id, 'MEMBER', '2024-02-03 09:00:00'
FROM staff s WHERE s.user_id = 14;

-- Add team members for Team 3 (Student Wellness)
INSERT INTO team_members (team_id, staff_id, role, joined_at)
SELECT 'team-wellness', s.id, 'LEAD', '2024-03-01 11:00:00'
FROM staff s WHERE s.user_id = 12
UNION ALL
SELECT 'team-wellness', s.id, 'MEMBER', '2024-03-02 11:00:00'
FROM staff s WHERE s.user_id = 15
UNION ALL
SELECT 'team-wellness', s.id, 'MEMBER', '2024-03-03 11:00:00'
FROM staff s WHERE s.user_id = 16;

-- Create meetings for Team 1 (Curriculum Development)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, team_id, status, created_at) 
SELECT 'Q1 Curriculum Standards Review', 'Quarterly review of curriculum standards alignment with state requirements', '2024-03-15 14:00:00', '2024-03-15 16:00:00', s.id, 2, 'team-curr-dev', 'COMPLETED', '2024-03-10 10:00:00'
FROM staff s WHERE s.user_id = 10;

INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, team_id, status, created_at)
SELECT 'Science Curriculum Update Planning', 'Planning session for integrating new science standards for grades 6-12', '2024-04-20 10:00:00', '2024-04-20 12:00:00', s.id, 2, 'team-curr-dev', 'COMPLETED', '2024-04-15 10:00:00'
FROM staff s WHERE s.user_id = 10;

INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, team_id, status, created_at)
SELECT 'Math Department Collaboration Meeting', 'Collaborative session with math department heads on new standards implementation', '2024-05-25 13:00:00', '2024-05-25 15:00:00', s.id, 2, 'team-curr-dev', 'SCHEDULED', '2024-05-20 10:00:00'
FROM staff s WHERE s.user_id = 10;

-- Create meetings for Team 2 (Technology Integration)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, team_id, status, created_at)
SELECT 'EdTech Platform Evaluation', 'Evaluation of new educational technology platforms for school-wide implementation', '2024-03-25 13:00:00', '2024-03-25 15:00:00', s.id, 3, 'team-tech-int', 'COMPLETED', '2024-03-20 10:00:00'
FROM staff s WHERE s.user_id = 11;

INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, team_id, status, created_at)
SELECT '1:1 Device Rollout Planning', 'Planning for 1:1 device implementation across all grade levels', '2024-05-10 09:00:00', '2024-05-10 11:30:00', s.id, 3, 'team-tech-int', 'COMPLETED', '2024-05-05 10:00:00'
FROM staff s WHERE s.user_id = 11;

-- Create meetings for Team 3 (Student Wellness)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, team_id, status, created_at)
SELECT 'Mental Health Support Program Launch', 'Planning launch of comprehensive mental health support program for students', '2024-04-05 11:00:00', '2024-04-05 13:00:00', s.id, 4, 'team-wellness', 'COMPLETED', '2024-04-01 10:00:00'
FROM staff s WHERE s.user_id = 12;

INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, team_id, status, created_at)
SELECT 'Wellness Activities Planning', 'Planning quarterly wellness activities and stress reduction programs', '2024-05-20 10:00:00', '2024-05-20 12:00:00', s.id, 4, 'team-wellness', 'COMPLETED', '2024-05-15 10:00:00'
FROM staff s WHERE s.user_id = 12;

-- Create agenda items for meetings
-- Team 1 Meeting 1: Q1 Curriculum Standards Review
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at) 
SELECT m.id, 'Math Standards Alignment Review', 'Current math curriculum needs alignment with new state standards', s.id, 'Discussion', 'Resolved', 1, '2024-03-10 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 11;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'English Language Arts Updates', 'ELA curriculum requires updates for next academic year', s.id, 'Decision', 'Resolved', 2, '2024-03-10 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 12;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Assessment Strategy Discussion', 'Need to update assessment methodologies across all subjects', s.id, 'Discussion', 'Pending', 3, '2024-03-10 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 10;

-- Team 1 Meeting 2: Science Curriculum Update Planning
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'New Lab Equipment Integration', 'New laboratory equipment needs integration into science curriculum', s.id, 'Decision', 'Resolved', 1, '2024-04-15 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'Science Curriculum Update Planning' AND s.user_id = 11;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Teacher Training Schedule', 'Science teachers need professional development on new standards', s.id, 'Information_Sharing', 'Ongoing', 2, '2024-04-15 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'Science Curriculum Update Planning' AND s.user_id = 12;

-- Team 2 Meeting 1: EdTech Platform Evaluation
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Learning Management System Review', 'District needs to select and implement a comprehensive LMS', s.id, 'Decision', 'Resolved', 1, '2024-03-20 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 11;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Digital Citizenship Curriculum', 'Students need comprehensive digital citizenship education', s.id, 'Discussion', 'Ongoing', 2, '2024-03-20 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 13;

-- Team 2 Meeting 2: 1:1 Device Rollout Planning
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Device Distribution Strategy', 'Need systematic approach for distributing devices across grade levels', s.id, 'Decision', 'Resolved', 1, '2024-05-05 10:00:00'
FROM meeting m, staff s 
WHERE m.title = '1:1 Device Rollout Planning' AND s.user_id = 11;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Tech Support Training', 'Staff need training to support 1:1 device initiative', s.id, 'Information_Sharing', 'Ongoing', 2, '2024-05-05 10:00:00'
FROM meeting m, staff s 
WHERE m.title = '1:1 Device Rollout Planning' AND s.user_id = 13;

-- Team 3 Meeting 1: Mental Health Support Program Launch
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Counselor Staffing Review', 'Current counseling staff capacity may be insufficient for student needs', s.id, 'Discussion', 'Resolved', 1, '2024-04-01 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id = 12;

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Wellness Program Activities', 'Students need structured wellness activities and stress reduction programs', s.id, 'Information_Sharing', 'Ongoing', 2, '2024-04-01 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id = 15;

-- Team 3 Meeting 2: Wellness Activities Planning
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Mindfulness Program Implementation', 'School needs comprehensive mindfulness and meditation programs', s.id, 'Decision', 'Resolved', 1, '2024-05-15 10:00:00'
FROM meeting m, staff s 
WHERE m.title = 'Wellness Activities Planning' AND s.user_id = 12;

-- Add meeting attendees
INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id IN (10, 11, 12);

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Science Curriculum Update Planning' AND s.user_id IN (10, 11);

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'EXCUSED' 
FROM meeting m, staff s 
WHERE m.title = 'Science Curriculum Update Planning' AND s.user_id = 12;

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
SELECT m.id, s.id, 'Great discussion on math standards alignment. Need to follow up with department heads on implementation timeline. Action items assigned to team members.', '2024-03-15 15:30:00'
FROM meeting m, staff s
WHERE m.title = 'Q1 Curriculum Standards Review' AND s.user_id = 10;

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'New lab equipment will arrive next month. Training sessions scheduled for all science teachers. Budget approved for additional materials.', '2024-04-20 11:45:00'
FROM meeting m, staff s
WHERE m.title = 'Science Curriculum Update Planning' AND s.user_id = 11;

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'LMS evaluation complete. Recommendation to proceed with Canvas implementation district-wide. Pilot program starts next semester.', '2024-03-25 14:30:00'
FROM meeting m, staff s
WHERE m.title = 'EdTech Platform Evaluation' AND s.user_id = 11;

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'Mental health support program approved. Will start with pilot program in high school before district rollout. Additional counselor positions approved.', '2024-04-05 12:30:00'
FROM meeting m, staff s
WHERE m.title = 'Mental Health Support Program Launch' AND s.user_id = 12;

-- Add team knowledge resources
INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-curr-dev', 'State Curriculum Standards Guide', 'Comprehensive guide to state curriculum standards and alignment requirements for all subjects. Includes detailed mapping of learning objectives, assessment criteria, and implementation timelines.', 'GUIDE', ARRAY['curriculum', 'standards', 'alignment', 'state-requirements'], u.id, s.id, true, 15, 3, '2024-01-20 10:00:00', '2024-01-20 10:00:00'
FROM users u, staff s WHERE u.id = 10 AND s.user_id = u.id;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-curr-dev', 'Assessment Best Practices', 'Collection of research-backed assessment methodologies and implementation strategies. Includes formative and summative assessment techniques, rubric development, and data analysis procedures.', 'DOCUMENT', ARRAY['assessment', 'best-practices', 'evaluation', 'rubrics'], u.id, s.id, false, 8, 1, '2024-02-10 10:00:00', '2024-02-10 10:00:00'
FROM users u, staff s WHERE u.id = 11 AND s.user_id = u.id;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-tech-int', 'EdTech Platform Comparison', 'Detailed comparison of educational technology platforms including features, pricing, and implementation requirements. Covers LMS, assessment tools, and collaboration platforms.', 'DOCUMENT', ARRAY['technology', 'platforms', 'comparison', 'LMS'], u.id, s.id, true, 22, 7, '2024-02-15 10:00:00', '2024-02-15 10:00:00'
FROM users u, staff s WHERE u.id = 11 AND s.user_id = u.id;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-tech-int', 'Digital Citizenship Resources', 'Collection of resources for teaching digital citizenship and online safety to students. Includes age-appropriate curricula, parent communication templates, and assessment tools.', 'TEMPLATE', ARRAY['digital-citizenship', 'safety', 'resources', 'curriculum'], u.id, s.id, false, 12, 5, '2024-03-01 10:00:00', '2024-03-01 10:00:00'
FROM users u, staff s WHERE u.id = 13 AND s.user_id = u.id;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-wellness', 'Student Wellness Program Framework', 'Comprehensive framework for implementing student wellness programs including mental health support, physical wellness activities, and social-emotional learning components.', 'POLICY', ARRAY['wellness', 'mental-health', 'framework', 'SEL'], u.id, s.id, true, 18, 4, '2024-03-05 10:00:00', '2024-03-05 10:00:00'
FROM users u, staff s WHERE u.id = 12 AND s.user_id = u.id;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-wellness', 'Crisis Intervention Procedures', 'Step-by-step procedures for handling student mental health crises including emergency contacts, intervention strategies, and follow-up protocols.', 'GUIDE', ARRAY['crisis', 'intervention', 'mental-health', 'emergency'], u.id, s.id, true, 25, 8, '2024-03-15 10:00:00', '2024-03-15 10:00:00'
FROM users u, staff s WHERE u.id = 15 AND s.user_id = u.id;

-- Summary of created data
SELECT 
    'Teams' as type, 
    COUNT(*) as count 
FROM teams
WHERE id LIKE 'team-%'
UNION ALL
SELECT 
    'Team Members' as type, 
    COUNT(*) as count 
FROM team_members
WHERE team_id LIKE 'team-%'
UNION ALL
SELECT 
    'Meetings' as type, 
    COUNT(*) as count 
FROM meeting 
WHERE team_id IS NOT NULL
UNION ALL
SELECT 
    'Agenda Items' as type, 
    COUNT(*) as count 
FROM meeting_agenda_items 
WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL)
UNION ALL
SELECT 
    'Meeting Attendees' as type, 
    COUNT(*) as count 
FROM meeting_attendee 
WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL)
UNION ALL
SELECT 
    'Meeting Notes' as type, 
    COUNT(*) as count 
FROM meeting_notes 
WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL)
UNION ALL
SELECT 
    'Knowledge Resources' as type, 
    COUNT(*) as count 
FROM team_knowledge
WHERE team_id LIKE 'team-%';

-- Show created teams with member counts
SELECT 
    t.name as team_name,
    t.code,
    t.description,
    COUNT(tm.staff_id) as member_count,
    STRING_AGG(DISTINCT u.name, ', ') as members
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN staff s ON tm.staff_id = s.id
LEFT JOIN users u ON s.user_id = u.id
WHERE t.id LIKE 'team-%'
GROUP BY t.id, t.name, t.code, t.description
ORDER BY t.name;
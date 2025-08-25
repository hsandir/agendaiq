-- Sample Teams Data with Meetings and Agenda Items (Fixed Schema)
-- Clean existing data first
DELETE FROM team_knowledge;
DELETE FROM meeting_notes;
DELETE FROM meeting_attendee;
DELETE FROM meeting_agenda_items;
DELETE FROM meeting WHERE team_id IS NOT NULL;
DELETE FROM team_members;
DELETE FROM teams;

-- Team 1: Curriculum Development Team
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-curr-dev', 'Curriculum Development Team', 'CURR-DEV', 'Responsible for developing and updating curriculum standards across all grade levels', 'To ensure our curriculum meets state standards and student learning objectives', 1, '2024-01-15 10:00:00', '2024-01-15 10:00:00');

-- Team 2: Technology Integration Team  
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-tech-int', 'Technology Integration Team', 'TECH-INT', 'Leading digital transformation and technology integration in education', 'To implement and optimize technology solutions for enhanced learning experiences', 2, '2024-02-01 09:00:00', '2024-02-01 09:00:00');

-- Team 3: Student Wellness Committee
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-wellness', 'Student Wellness Committee', 'WELLNESS', 'Focused on student mental health, physical wellness, and overall well-being', 'To develop and implement comprehensive wellness programs for student success', 3, '2024-03-01 11:00:00', '2024-03-01 11:00:00');

-- Add team members for Team 1 (Curriculum Development)
INSERT INTO team_members (team_id, staff_id, role, joined_at) VALUES
('team-curr-dev', 1, 'LEAD', '2024-01-15 10:00:00'),
('team-curr-dev', 2, 'MEMBER', '2024-01-16 10:00:00'),
('team-curr-dev', 3, 'MEMBER', '2024-01-17 10:00:00');

-- Add team members for Team 2 (Technology Integration)
INSERT INTO team_members (team_id, staff_id, role, joined_at) VALUES
('team-tech-int', 2, 'LEAD', '2024-02-01 09:00:00'),
('team-tech-int', 4, 'MEMBER', '2024-02-02 09:00:00'),
('team-tech-int', 5, 'MEMBER', '2024-02-03 09:00:00');

-- Add team members for Team 3 (Student Wellness)
INSERT INTO team_members (team_id, staff_id, role, joined_at) VALUES
('team-wellness', 3, 'LEAD', '2024-03-01 11:00:00'),
('team-wellness', 1, 'MEMBER', '2024-03-02 11:00:00'),
('team-wellness', 6, 'MEMBER', '2024-03-03 11:00:00');

-- Create meetings for Team 1 (Curriculum Development)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, team_id, status, created_at) VALUES
('Q1 Curriculum Standards Review', 'Quarterly review of curriculum standards alignment with state requirements', '2024-03-15 14:00:00', '2024-03-15 16:00:00', 1, 'team-curr-dev', 'COMPLETED', '2024-03-10 10:00:00'),
('Science Curriculum Update Planning', 'Planning session for integrating new science standards for grades 6-12', '2024-04-20 10:00:00', '2024-04-20 12:00:00', 1, 'team-curr-dev', 'COMPLETED', '2024-04-15 10:00:00'),
('Math Department Collaboration Meeting', 'Collaborative session with math department heads on new standards implementation', '2024-05-25 13:00:00', '2024-05-25 15:00:00', 1, 'team-curr-dev', 'SCHEDULED', '2024-05-20 10:00:00');

-- Create meetings for Team 2 (Technology Integration)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, team_id, status, created_at) VALUES
('EdTech Platform Evaluation', 'Evaluation of new educational technology platforms for school-wide implementation', '2024-03-25 13:00:00', '2024-03-25 15:00:00', 2, 'team-tech-int', 'COMPLETED', '2024-03-20 10:00:00'),
('1:1 Device Rollout Planning', 'Planning for 1:1 device implementation across all grade levels', '2024-05-10 09:00:00', '2024-05-10 11:30:00', 2, 'team-tech-int', 'COMPLETED', '2024-05-05 10:00:00'),
('Network Infrastructure Upgrade', 'Planning network infrastructure improvements for increased device capacity', '2024-06-15 14:00:00', '2024-06-15 16:00:00', 2, 'team-tech-int', 'SCHEDULED', '2024-06-10 10:00:00');

-- Create meetings for Team 3 (Student Wellness)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, team_id, status, created_at) VALUES
('Mental Health Support Program Launch', 'Planning launch of comprehensive mental health support program for students', '2024-04-05 11:00:00', '2024-04-05 13:00:00', 3, 'team-wellness', 'COMPLETED', '2024-04-01 10:00:00'),
('Wellness Activities Planning', 'Planning quarterly wellness activities and stress reduction programs', '2024-05-20 10:00:00', '2024-05-20 12:00:00', 3, 'team-wellness', 'COMPLETED', '2024-05-15 10:00:00');

-- Create agenda items for meetings
-- Team 1 Meeting 1: Q1 Curriculum Standards Review
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at) 
SELECT m.id, 'Math Standards Alignment Review', 'Current math curriculum needs alignment with new state standards', 2, 'Review', 'Discussed', 1, '2024-03-10 10:00:00'
FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'English Language Arts Updates', 'ELA curriculum requires updates for next academic year', 3, 'Review', 'Approved', 2, '2024-03-10 10:00:00'
FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Assessment Strategy Discussion', 'Need to update assessment methodologies across all subjects', 1, 'Discussion', 'Pending', 3, '2024-03-10 10:00:00'
FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review';

-- Team 1 Meeting 2: Science Curriculum Update Planning
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'New Lab Equipment Integration', 'New laboratory equipment needs integration into science curriculum', 2, 'Planning', 'Approved', 1, '2024-04-15 10:00:00'
FROM meeting m WHERE m.title = 'Science Curriculum Update Planning';

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Teacher Training Schedule', 'Science teachers need professional development on new standards', 3, 'Planning', 'In_Progress', 2, '2024-04-15 10:00:00'
FROM meeting m WHERE m.title = 'Science Curriculum Update Planning';

-- Team 2 Meeting 1: EdTech Platform Evaluation
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Learning Management System Review', 'District needs to select and implement a comprehensive LMS', 2, 'Review', 'Approved', 1, '2024-03-20 10:00:00'
FROM meeting m WHERE m.title = 'EdTech Platform Evaluation';

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Digital Citizenship Curriculum', 'Students need comprehensive digital citizenship education', 4, 'Planning', 'In_Progress', 2, '2024-03-20 10:00:00'
FROM meeting m WHERE m.title = 'EdTech Platform Evaluation';

-- Team 2 Meeting 2: 1:1 Device Rollout Planning
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Device Distribution Strategy', 'Need systematic approach for distributing devices across grade levels', 2, 'Planning', 'Approved', 1, '2024-05-05 10:00:00'
FROM meeting m WHERE m.title = '1:1 Device Rollout Planning';

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Tech Support Training', 'Staff need training to support 1:1 device initiative', 4, 'Planning', 'In_Progress', 2, '2024-05-05 10:00:00'
FROM meeting m WHERE m.title = '1:1 Device Rollout Planning';

-- Team 3 Meeting 1: Mental Health Support Program Launch
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Counselor Staffing Review', 'Current counseling staff capacity may be insufficient for student needs', 3, 'Review', 'Approved', 1, '2024-04-01 10:00:00'
FROM meeting m WHERE m.title = 'Mental Health Support Program Launch';

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Wellness Program Activities', 'Students need structured wellness activities and stress reduction programs', 1, 'Planning', 'In_Progress', 2, '2024-04-01 10:00:00'
FROM meeting m WHERE m.title = 'Mental Health Support Program Launch';

-- Team 3 Meeting 2: Wellness Activities Planning
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at)
SELECT m.id, 'Mindfulness Program Implementation', 'School needs comprehensive mindfulness and meditation programs', 3, 'Implementation', 'Approved', 1, '2024-05-15 10:00:00'
FROM meeting m WHERE m.title = 'Wellness Activities Planning';

-- Add meeting attendees
INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 1, 'ATTENDED' FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review'
UNION ALL
SELECT m.id, 2, 'ATTENDED' FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review'
UNION ALL
SELECT m.id, 3, 'ATTENDED' FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review'
UNION ALL
SELECT m.id, 1, 'ATTENDED' FROM meeting m WHERE m.title = 'Science Curriculum Update Planning'
UNION ALL
SELECT m.id, 2, 'ATTENDED' FROM meeting m WHERE m.title = 'Science Curriculum Update Planning'
UNION ALL
SELECT m.id, 2, 'ATTENDED' FROM meeting m WHERE m.title = 'EdTech Platform Evaluation'
UNION ALL
SELECT m.id, 4, 'ATTENDED' FROM meeting m WHERE m.title = 'EdTech Platform Evaluation'
UNION ALL
SELECT m.id, 5, 'ATTENDED' FROM meeting m WHERE m.title = 'EdTech Platform Evaluation'
UNION ALL
SELECT m.id, 3, 'ATTENDED' FROM meeting m WHERE m.title = 'Mental Health Support Program Launch'
UNION ALL
SELECT m.id, 1, 'ATTENDED' FROM meeting m WHERE m.title = 'Mental Health Support Program Launch'
UNION ALL
SELECT m.id, 6, 'ATTENDED' FROM meeting m WHERE m.title = 'Mental Health Support Program Launch';

-- Add meeting notes
INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 1, 'Great discussion on math standards alignment. Need to follow up with department heads on implementation timeline. Action items assigned to team members.', '2024-03-15 15:30:00'
FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 2, 'New lab equipment will arrive next month. Training sessions scheduled for all science teachers. Budget approved for additional materials.', '2024-04-20 11:45:00'
FROM meeting m WHERE m.title = 'Science Curriculum Update Planning';

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 2, 'LMS evaluation complete. Recommendation to proceed with Canvas implementation district-wide. Pilot program starts next semester.', '2024-03-25 14:30:00'
FROM meeting m WHERE m.title = 'EdTech Platform Evaluation';

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 3, 'Mental health support program approved. Will start with pilot program in high school before district rollout. Additional counselor positions approved.', '2024-04-05 12:30:00'
FROM meeting m WHERE m.title = 'Mental Health Support Program Launch';

-- Add team knowledge resources
INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-curr-dev', 'State Curriculum Standards Guide', 'Comprehensive guide to state curriculum standards and alignment requirements for all subjects. Includes detailed mapping of learning objectives, assessment criteria, and implementation timelines.', 'GUIDE', ARRAY['curriculum', 'standards', 'alignment', 'state-requirements'], u.id, 1, true, 15, 3, '2024-01-20 10:00:00', '2024-01-20 10:00:00'
FROM users u WHERE u.id = 1;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-curr-dev', 'Assessment Best Practices', 'Collection of research-backed assessment methodologies and implementation strategies. Includes formative and summative assessment techniques, rubric development, and data analysis procedures.', 'DOCUMENT', ARRAY['assessment', 'best-practices', 'evaluation', 'rubrics'], u.id, 2, false, 8, 1, '2024-02-10 10:00:00', '2024-02-10 10:00:00'
FROM users u WHERE u.id = 2;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-tech-int', 'EdTech Platform Comparison', 'Detailed comparison of educational technology platforms including features, pricing, and implementation requirements. Covers LMS, assessment tools, and collaboration platforms.', 'DOCUMENT', ARRAY['technology', 'platforms', 'comparison', 'LMS'], u.id, 2, true, 22, 7, '2024-02-15 10:00:00', '2024-02-15 10:00:00'
FROM users u WHERE u.id = 2;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-tech-int', 'Digital Citizenship Resources', 'Collection of resources for teaching digital citizenship and online safety to students. Includes age-appropriate curricula, parent communication templates, and assessment tools.', 'TEMPLATE', ARRAY['digital-citizenship', 'safety', 'resources', 'curriculum'], u.id, 4, false, 12, 5, '2024-03-01 10:00:00', '2024-03-01 10:00:00'
FROM users u WHERE u.id = 4;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-wellness', 'Student Wellness Program Framework', 'Comprehensive framework for implementing student wellness programs including mental health support, physical wellness activities, and social-emotional learning components.', 'POLICY', ARRAY['wellness', 'mental-health', 'framework', 'SEL'], u.id, 3, true, 18, 4, '2024-03-05 10:00:00', '2024-03-05 10:00:00'
FROM users u WHERE u.id = 3;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-wellness', 'Crisis Intervention Procedures', 'Step-by-step procedures for handling student mental health crises including emergency contacts, intervention strategies, and follow-up protocols.', 'GUIDE', ARRAY['crisis', 'intervention', 'mental-health', 'emergency'], u.id, 1, true, 25, 8, '2024-03-15 10:00:00', '2024-03-15 10:00:00'
FROM users u WHERE u.id = 1;

-- Summary of created data
SELECT 
    'Teams' as type, 
    COUNT(*) as count 
FROM teams
UNION ALL
SELECT 
    'Team Members' as type, 
    COUNT(*) as count 
FROM team_members
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
FROM team_knowledge;
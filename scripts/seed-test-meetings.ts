/**
 * Seed script to generate 20 test meetings with various scenarios
 * This creates a comprehensive test environment for the meeting tracking system
 */

import { PrismaClient } from '@prisma/client';
import { addDays, addHours, subDays, subHours, addWeeks, addMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting test meeting generation...');

  try {
    // Get existing staff and departments
    const staff = await prisma.staff.findMany({
      include: {
        User: true,
        Role: true,
        Department: true,
        School: true
      },
      take: 10
    });

    if (staff.length < 3) {
      console.error('❌ Not enough staff in database. Please seed staff first.');
      return;
    }

    const departments = await prisma.department.findMany({ take: 5 });
    
    if (departments.length === 0) {
      console.error('❌ No departments found. Please seed departments first.');
      return;
    }

    console.log(`Found ${staff.length} staff members and ${departments.length} departments`);

    // Meeting scenarios
    const meetings = [];
    const now = new Date();

    // 1. Past completed department meeting with action items (completed)
    meetings.push({
      title: "Q4 Department Review Meeting",
      description: "Quarterly review of department goals and performance metrics",
      start_time: subDays(now, 7),
      end_time: subDays(addHours(now, 2), 7),
      status: "completed",
      meeting_type: "department",
      organizer_id: staff[0].id,
      department_id: departments[0].id,
      school_id: staff[0].school_id,
      district_id: staff[0].district_id,
      location: "Conference Room A",
      is_recurring: false,
      notes: "Discussed Q4 targets, budget allocation, and team performance",
      agendaItems: [
        { title: "Q4 Performance Review", description: "Review KPIs and metrics", duration: 30 },
        { title: "Budget Discussion", description: "2024 budget planning", duration: 45 },
        { title: "Team Updates", description: "Department team updates", duration: 30 }
      ],
      actionItems: [
        { title: "Prepare Q1 budget proposal", assignee: staff[1].id, status: "completed" },
        { title: "Update performance dashboards", assignee: staff[2].id, status: "in_progress" }
      ]
    });

    // 2. Recurring weekly team standup (ongoing series)
    const standupSeries = `series_${Date.now()}_standup`;
    for (let i = 0; i < 4; i++) {
      meetings.push({
        title: `Weekly Team Standup (${i + 1}/4)`,
        description: "Weekly team synchronization and progress updates",
        start_time: addWeeks(subDays(now, 14), i),
        end_time: addHours(addWeeks(subDays(now, 14), i), 1),
        status: i < 2 ? "completed" : "scheduled",
        meeting_type: "regular",
        organizer_id: staff[1].id,
        department_id: departments[0].id,
        school_id: staff[1].school_id,
        district_id: staff[1].district_id,
        location: "Team Room",
        is_recurring: true,
        series_id: standupSeries,
        series_position: i + 1,
        is_series_master: i === 0,
        repeat_type: "weekly",
        repeat_pattern: "weekly",
        repeat_interval: 1,
        agendaItems: [
          { title: "Last week's achievements", duration: 15 },
          { title: "This week's goals", duration: 15 },
          { title: "Blockers and issues", duration: 15 }
        ]
      });
    }

    // 3. One-on-one performance review (completed with follow-up)
    meetings.push({
      title: "Performance Review - Annual",
      description: "Annual performance review and goal setting session",
      start_time: subDays(now, 14),
      end_time: subDays(addHours(now, 1.5), 14),
      status: "completed",
      meeting_type: "one_on_one",
      organizer_id: staff[0].id,
      department_id: departments[0].id,
      school_id: staff[0].school_id,
      district_id: staff[0].district_id,
      location: "Manager's Office",
      is_continuation: false,
      agendaItems: [
        { title: "Year in review", description: "Discuss achievements and challenges", duration: 30 },
        { title: "Goal setting for next year", description: "Define SMART goals", duration: 30 },
        { title: "Career development plan", description: "Discuss growth opportunities", duration: 30 }
      ],
      actionItems: [
        { title: "Complete self-assessment form", assignee: staff[2].id, status: "completed" },
        { title: "Enroll in leadership training", assignee: staff[2].id, status: "pending" }
      ]
    });

    // 4. Continuation meeting from #3
    meetings.push({
      title: "Performance Review - Annual (Continuation)",
      description: "Follow-up on performance review action items",
      start_time: addDays(now, 7),
      end_time: addDays(addHours(now, 1), 7),
      status: "scheduled",
      meeting_type: "one_on_one",
      organizer_id: staff[0].id,
      department_id: departments[0].id,
      school_id: staff[0].school_id,
      district_id: staff[0].district_id,
      location: "Manager's Office",
      is_continuation: true,
      parent_meeting_id: 3, // Will be updated after creation
      agendaItems: [
        { title: "Review action items from last meeting", duration: 20 },
        { title: "Discuss training progress", duration: 20 },
        { title: "Q1 objectives alignment", duration: 20 }
      ]
    });

    // 5. All-hands meeting (large attendance)
    meetings.push({
      title: "Q1 All-Hands Meeting",
      description: "Quarterly all-hands meeting for entire organization",
      start_time: addDays(now, 14),
      end_time: addDays(addHours(now, 2), 14),
      status: "scheduled",
      meeting_type: "all_hands",
      organizer_id: staff[0].id,
      department_id: departments[0].id,
      school_id: staff[0].school_id,
      district_id: staff[0].district_id,
      location: "Main Auditorium",
      is_public: true,
      allow_guests: true,
      record_meeting: true,
      agendaItems: [
        { title: "CEO Opening Remarks", duration: 15 },
        { title: "Q4 Results Overview", duration: 30 },
        { title: "Q1 Priorities and Goals", duration: 30 },
        { title: "Department Highlights", duration: 30 },
        { title: "Q&A Session", duration: 15 }
      ]
    });

    // 6. Project kickoff meeting
    meetings.push({
      title: "New LMS Implementation Kickoff",
      description: "Kickoff meeting for the new learning management system project",
      start_time: addDays(now, 3),
      end_time: addDays(addHours(now, 2), 3),
      status: "scheduled",
      meeting_type: "project",
      organizer_id: staff[2].id,
      department_id: departments[1]?.id || departments[0].id,
      school_id: staff[2].school_id,
      district_id: staff[2].district_id,
      location: "Project Room",
      agendaItems: [
        { title: "Project Overview", description: "Scope, timeline, and objectives", duration: 30 },
        { title: "Team Introductions", description: "Meet the project team", duration: 15 },
        { title: "Roles and Responsibilities", description: "RACI matrix review", duration: 20 },
        { title: "Timeline and Milestones", description: "Key dates and deliverables", duration: 25 },
        { title: "Next Steps", description: "Immediate action items", duration: 10 }
      ],
      actionItems: [
        { title: "Set up project Slack channel", assignee: staff[3]?.id || staff[2].id, status: "pending" },
        { title: "Schedule vendor demo", assignee: staff[2].id, status: "pending" },
        { title: "Create project charter", assignee: staff[2].id, status: "pending" }
      ]
    });

    // 7. Emergency meeting (urgent)
    meetings.push({
      title: "Urgent: System Outage Response",
      description: "Emergency meeting to address critical system outage",
      start_time: subHours(now, 2),
      end_time: subHours(now, 1),
      status: "completed",
      meeting_type: "emergency",
      organizer_id: staff[1].id,
      department_id: departments[0].id,
      school_id: staff[1].school_id,
      district_id: staff[1].district_id,
      location: "Virtual - Zoom",
      meeting_link: "https://zoom.us/j/123456789",
      agendaItems: [
        { title: "Incident Overview", duration: 10 },
        { title: "Impact Assessment", duration: 15 },
        { title: "Resolution Plan", duration: 20 },
        { title: "Communication Strategy", duration: 15 }
      ],
      actionItems: [
        { title: "Implement hotfix", assignee: staff[3]?.id || staff[1].id, status: "completed" },
        { title: "Send customer notification", assignee: staff[1].id, status: "completed" },
        { title: "Post-mortem analysis", assignee: staff[2].id, status: "in_progress" }
      ]
    });

    // 8. Training session
    meetings.push({
      title: "New Teacher Orientation - Day 1",
      description: "Comprehensive orientation program for new teaching staff",
      start_time: addDays(now, 21),
      end_time: addDays(addHours(now, 4), 21),
      status: "scheduled",
      meeting_type: "training",
      organizer_id: staff[3]?.id || staff[0].id,
      department_id: departments[2]?.id || departments[0].id,
      school_id: staff[0].school_id,
      district_id: staff[0].district_id,
      location: "Training Center",
      agendaItems: [
        { title: "Welcome and Introductions", duration: 30 },
        { title: "School Policies and Procedures", duration: 60 },
        { title: "Curriculum Overview", duration: 60 },
        { title: "Technology Systems Training", duration: 60 },
        { title: "Q&A and Wrap-up", duration: 30 }
      ]
    });

    // 9. Board meeting (high priority)
    meetings.push({
      title: "Monthly Board Meeting",
      description: "Regular monthly board of directors meeting",
      start_time: addDays(now, 10),
      end_time: addDays(addHours(now, 3), 10),
      status: "scheduled",
      meeting_type: "board",
      organizer_id: staff[0].id,
      department_id: departments[0].id,
      school_id: staff[0].school_id,
      district_id: staff[0].district_id,
      location: "Board Room",
      is_public: false,
      record_meeting: true,
      agendaItems: [
        { title: "Call to Order", duration: 5 },
        { title: "Previous Minutes Approval", duration: 10 },
        { title: "Financial Report", duration: 30 },
        { title: "Academic Performance Review", duration: 45 },
        { title: "New Business", duration: 60 },
        { title: "Executive Session", duration: 30 }
      ]
    });

    // 10. Parent-teacher conference
    meetings.push({
      title: "Parent-Teacher Conference - Spring",
      description: "Individual parent-teacher conferences for student progress review",
      start_time: addDays(now, 5),
      end_time: addDays(addHours(now, 0.5), 5),
      status: "scheduled",
      meeting_type: "conference",
      organizer_id: staff[4]?.id || staff[1].id,
      department_id: departments[1]?.id || departments[0].id,
      school_id: staff[1].school_id,
      district_id: staff[1].district_id,
      location: "Classroom 201",
      agendaItems: [
        { title: "Academic Progress Review", duration: 10 },
        { title: "Behavioral Assessment", duration: 10 },
        { title: "Goals for Next Quarter", duration: 10 }
      ]
    });

    // 11-15: Monthly department meetings (recurring series)
    const monthlySeriesId = `series_${Date.now()}_monthly`;
    for (let i = 0; i < 5; i++) {
      meetings.push({
        title: `Monthly Department Sync - ${['January', 'February', 'March', 'April', 'May'][i]}`,
        description: "Regular monthly department synchronization meeting",
        start_time: addMonths(now, i - 2),
        end_time: addHours(addMonths(now, i - 2), 1.5),
        status: i < 3 ? "completed" : "scheduled",
        meeting_type: "department",
        organizer_id: staff[0].id,
        department_id: departments[0].id,
        school_id: staff[0].school_id,
        district_id: staff[0].district_id,
        location: "Department Conference Room",
        is_recurring: true,
        series_id: monthlySeriesId,
        series_position: i + 1,
        is_series_master: i === 0,
        repeat_type: "monthly",
        repeat_pattern: "monthly",
        repeat_interval: 1,
        repeat_month_day: 15,
        agendaItems: [
          { title: "Department Updates", duration: 20 },
          { title: "Project Status Review", duration: 30 },
          { title: "Resource Planning", duration: 20 },
          { title: "Open Discussion", duration: 20 }
        ]
      });
    }

    // 16. Cancelled meeting
    meetings.push({
      title: "Budget Planning Session",
      description: "Annual budget planning and allocation meeting",
      start_time: subDays(now, 3),
      end_time: subDays(addHours(now, 2), 3),
      status: "cancelled",
      meeting_type: "planning",
      organizer_id: staff[1].id,
      department_id: departments[0].id,
      school_id: staff[1].school_id,
      district_id: staff[1].district_id,
      location: "Finance Room",
      notes: "Cancelled due to incomplete financial reports"
    });

    // 17. In-progress meeting (happening now)
    meetings.push({
      title: "Live: Staff Development Workshop",
      description: "Professional development workshop in progress",
      start_time: subHours(now, 1),
      end_time: addHours(now, 1),
      status: "in_progress",
      meeting_type: "workshop",
      organizer_id: staff[2].id,
      department_id: departments[1]?.id || departments[0].id,
      school_id: staff[2].school_id,
      district_id: staff[2].district_id,
      location: "Workshop Hall",
      meeting_link: "https://teams.microsoft.com/meet/123",
      agendaItems: [
        { title: "Introduction to New Teaching Methods", duration: 30 },
        { title: "Interactive Workshop", duration: 60 },
        { title: "Best Practices Sharing", duration: 30 }
      ]
    });

    // 18. Retrospective meeting
    meetings.push({
      title: "Sprint Retrospective",
      description: "Bi-weekly sprint retrospective and improvement discussion",
      start_time: subDays(now, 1),
      end_time: subDays(addHours(now, 1), 1),
      status: "completed",
      meeting_type: "retrospective",
      organizer_id: staff[3]?.id || staff[1].id,
      department_id: departments[2]?.id || departments[0].id,
      school_id: staff[1].school_id,
      district_id: staff[1].district_id,
      location: "Agile Room",
      agendaItems: [
        { title: "What went well?", duration: 20 },
        { title: "What could be improved?", duration: 20 },
        { title: "Action items for next sprint", duration: 20 }
      ],
      actionItems: [
        { title: "Improve code review process", assignee: staff[2].id, status: "pending" },
        { title: "Update documentation standards", assignee: staff[3]?.id || staff[1].id, status: "pending" }
      ]
    });

    // 19. Interview panel
    meetings.push({
      title: "Interview Panel - Senior Teacher Position",
      description: "Interview panel for senior teacher candidate",
      start_time: addDays(now, 2),
      end_time: addDays(addHours(now, 1.5), 2),
      status: "scheduled",
      meeting_type: "interview",
      organizer_id: staff[0].id,
      department_id: departments[0].id,
      school_id: staff[0].school_id,
      district_id: staff[0].district_id,
      location: "Interview Room 1",
      agendaItems: [
        { title: "Panel Introduction", duration: 5 },
        { title: "Candidate Presentation", duration: 20 },
        { title: "Technical Questions", duration: 30 },
        { title: "Behavioral Questions", duration: 20 },
        { title: "Candidate Questions", duration: 10 },
        { title: "Panel Discussion", duration: 15 }
      ]
    });

    // 20. Strategy planning session
    meetings.push({
      title: "2024-2025 Academic Year Planning",
      description: "Strategic planning session for upcoming academic year",
      start_time: addDays(now, 30),
      end_time: addDays(addHours(now, 4), 30),
      status: "scheduled",
      meeting_type: "strategic",
      organizer_id: staff[0].id,
      department_id: departments[0].id,
      school_id: staff[0].school_id,
      district_id: staff[0].district_id,
      location: "Strategic Planning Room",
      agendaItems: [
        { title: "Vision and Mission Review", duration: 30 },
        { title: "SWOT Analysis", duration: 60 },
        { title: "Goal Setting", duration: 60 },
        { title: "Resource Planning", duration: 45 },
        { title: "Implementation Timeline", duration: 30 },
        { title: "Success Metrics Definition", duration: 15 }
      ],
      actionItems: [
        { title: "Draft strategic plan document", assignee: staff[0].id, status: "pending" },
        { title: "Budget allocation proposal", assignee: staff[1].id, status: "pending" },
        { title: "Stakeholder communication plan", assignee: staff[2].id, status: "pending" }
      ]
    });

    // Create all meetings
    console.log('📝 Creating meetings...');
    let createdCount = 0;
    let continuationMeetingId: number | null = null;

    for (const meetingData of meetings) {
      const { agendaItems, actionItems, ...meeting } = meetingData;
      
      // Handle continuation meeting reference
      if (meeting.title.includes("(Continuation)") && continuationMeetingId) {
        meeting.parent_meeting_id = continuationMeetingId;
      }
      
      const created = await prisma.meeting.create({
        data: {
          ...meeting,
          MeetingAgendaItems: {
            create: agendaItems?.map((item, index) => ({
              title: item.title,
              description: item.description || '',
              duration_minutes: item.duration,
              order_index: index,
              presenter_id: staff[Math.floor(Math.random() * Math.min(3, staff.length))].id,
              status: meeting.status === 'completed' ? 'completed' : 'pending',
              item_type: 'discussion'
            }))
          },
          MeetingAttendee: {
            create: staff.slice(0, Math.floor(Math.random() * 4) + 2).map(s => ({
              staff_id: s.id,
              status: meeting.status === 'completed' ? 'attended' : 
                     meeting.status === 'scheduled' ? 'accepted' : 'pending',
              is_required: Math.random() > 0.3,
              role_in_meeting: s.id === meeting.organizer_id ? 'organizer' : 
                              Math.random() > 0.7 ? 'presenter' : 'participant'
            }))
          },
          MeetingActionItems: actionItems ? {
            create: actionItems.map(item => ({
              title: item.title,
              description: '',
              assigned_to_id: item.assignee,
              due_date: addDays(meeting.start_time as Date, 7),
              priority: Math.random() > 0.5 ? 'high' : 'medium',
              status: item.status || 'pending'
            }))
          } : undefined
        }
      });
      
      // Save the performance review meeting ID for continuation reference
      if (meeting.title === "Performance Review - Annual") {
        continuationMeetingId = created.id;
      }
      
      createdCount++;
      console.log(`✅ Created meeting ${createdCount}/20: ${meeting.title}`);
    }

    console.log(`\n🎉 Successfully created ${createdCount} test meetings!`);
    console.log('📊 Meeting breakdown:');
    console.log('  - Past meetings: 8');
    console.log('  - Current/In-progress: 1');
    console.log('  - Future meetings: 11');
    console.log('  - Recurring series: 2 (9 total meetings)');
    console.log('  - With action items: 7');
    console.log('  - Continuation meetings: 1');
    
  } catch (error) {
    console.error('❌ Error creating test meetings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
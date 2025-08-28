import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  // Skip auth for dev endpoint
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Development endpoint only' }, { status: 403 });
  }

  try {
    console.log('🚀 Creating sample teams data...');

    // Get existing users and staff
    const users = await prisma.users.findMany({
      include: {
        staff: true
      },
      take: 10
    });

    if (users.length < 3) {
      return NextResponse.json({ error: 'Need at least 3 users to create teams' }, { status: 400 });
    }

    const staffMembers = users.filter(u => u.staff.length > 0).map(u => u.staff[0]);
    
    if (staffMembers.length < 3) {
      return NextResponse.json({ error: 'Need at least 3 staff members to create teams' }, { status: 400 });
    }

    // Delete existing teams data to start fresh
    await prisma.team_knowledge.deleteMany();
    await prisma.meeting_notes.deleteMany();
    await prisma.meeting_attendee.deleteMany();
    await prisma.meeting_agenda_items.deleteMany();
    await prisma.meeting.deleteMany({ where: { team_id: { not: null } } });
    await prisma.team_members.deleteMany();
    await prisma.teams.deleteMany();

    // Create Team 1: Curriculum Development Team
    const team1 = await prisma.teams.create({
      data: {
        id: randomBytes(16).toString('hex'),
        name: 'Curriculum Development Team',
        code: `TEAM_${Date.now()}_${randomBytes(4).toString('hex').toUpperCase()}`,
        description: 'Responsible for developing and updating curriculum standards across all grade levels',
        type: 'DEPARTMENT',
        purpose: 'To ensure our curriculum meets state standards and student learning objectives',
        created_by: users[0].id,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15')
      } as any
    });

    // Add team members to Team 1
    await prisma.team_members.createMany({
      data: [
        {
          id: randomBytes(16).toString('hex'),
          team_id: team1.id,
          user_id: users[0].id,
          staff_id: staffMembers[0].id,
          role: 'LEAD',
          joined_at: new Date('2024-01-15')
        },
        {
          id: randomBytes(16).toString('hex'),
          team_id: team1.id,
          user_id: users[1].id,
          staff_id: staffMembers[1].id,
          role: 'MEMBER',
          joined_at: new Date('2024-01-16')
        },
        {
          id: randomBytes(16).toString('hex'),
          team_id: team1.id,
          user_id: users[2].id,
          staff_id: staffMembers[2].id,
          role: 'MEMBER',
          joined_at: new Date('2024-01-17')
        }
      ]
    });

    // Create Team 2: Technology Integration Team
    const team2 = await prisma.teams.create({
      data: {
        id: randomBytes(16).toString('hex'),
        name: 'Technology Integration Team',
        code: `TEAM_${Date.now() + 1}_${randomBytes(4).toString('hex').toUpperCase()}`,
        description: 'Leading digital transformation and technology integration in education',
        type: 'PROJECT',
        purpose: 'To implement and optimize technology solutions for enhanced learning experiences',
        created_by: users[1].id,
        created_at: new Date('2024-02-01'),
        updated_at: new Date('2024-02-01')
      } as any
    });

    // Add team members to Team 2
    await prisma.team_members.createMany({
      data: [
        {
          id: randomBytes(16).toString('hex'),
          team_id: team2.id,
          user_id: users[1].id,
          staff_id: staffMembers[1].id,
          role: 'LEAD',
          joined_at: new Date('2024-02-01')
        },
        {
          id: randomBytes(16).toString('hex'),
          team_id: team2.id,
          user_id: users[3] ? users[3].id : users[0].id,
          staff_id: staffMembers[3] ? staffMembers[3].id : staffMembers[0].id,
          role: 'MEMBER',
          joined_at: new Date('2024-02-02')
        },
        {
          id: randomBytes(16).toString('hex'),
          team_id: team2.id,
          user_id: users[4] ? users[4].id : users[2].id,
          staff_id: staffMembers[4] ? staffMembers[4].id : staffMembers[2].id,
          role: 'MEMBER',
          joined_at: new Date('2024-02-03')
        }
      ]
    });

    // Create Team 3: Student Wellness Committee
    const team3 = await prisma.teams.create({
      data: {
        id: randomBytes(16).toString('hex'),
        name: 'Student Wellness Committee',
        code: `TEAM_${Date.now() + 2}_${randomBytes(4).toString('hex').toUpperCase()}`,
        description: 'Focused on student mental health, physical wellness, and overall well-being',
        type: 'COMMITTEE',
        purpose: 'To develop and implement comprehensive wellness programs for student success',
        created_by: users[2].id,
        created_at: new Date('2024-03-01'),
        updated_at: new Date('2024-03-01')
      } as any
    });

    // Add team members to Team 3
    await prisma.team_members.createMany({
      data: [
        {
          id: randomBytes(16).toString('hex'),
          team_id: team3.id,
          user_id: users[2].id,
          staff_id: staffMembers[2].id,
          role: 'LEAD',
          joined_at: new Date('2024-03-01')
        },
        {
          id: randomBytes(16).toString('hex'),
          team_id: team3.id,
          user_id: users[0].id,
          staff_id: staffMembers[0].id,
          role: 'MEMBER',
          joined_at: new Date('2024-03-02')
        },
        {
          id: randomBytes(16).toString('hex'),
          team_id: team3.id,
          user_id: users[5] ? users[5].id : users[1].id,
          staff_id: staffMembers[5] ? staffMembers[5].id : staffMembers[1].id,
          role: 'MEMBER',
          joined_at: new Date('2024-03-03')
        }
      ]
    });

    // Create meetings for Team 1
    const team1Meeting1 = await prisma.meeting.create({
      data: {
        title: 'Q1 Curriculum Standards Review',
        description: 'Quarterly review of curriculum standards alignment with state requirements',
        start_time: new Date('2024-03-15T14:00:00'),
        end_time: new Date('2024-03-15T16:00:00'),
        organizer_id: staffMembers[0].id,
        team_id: team1.id,
        status: 'COMPLETED',
        department_id: staffMembers[0].department_id || 1,
        school_id: staffMembers[0].school_id || 1,
        district_id: staffMembers[0].district_id || 1,
        created_at: new Date('2024-03-10')
      } as any
    });

    const team1Meeting2 = await prisma.meeting.create({
      data: {
        title: 'Science Curriculum Update Planning',
        description: 'Planning session for integrating new science standards for grades 6-12',
        start_time: new Date('2024-04-20T10:00:00'),
        end_time: new Date('2024-04-20T12:00:00'),
        organizer_id: staffMembers[0].id,
        team_id: team1.id,
        status: 'COMPLETED',
        department_id: staffMembers[0].department_id || 1,
        school_id: staffMembers[0].school_id || 1,
        district_id: staffMembers[0].district_id || 1,
        created_at: new Date('2024-04-15')
      } as any
    });

    // Create agenda items for Team 1 Meeting 1
    await prisma.meeting_agenda_items.createMany({
      data: [
        {
          meeting_id: team1Meeting1.id,
          topic: 'Math Standards Alignment Review',
          problem_statement: 'Review current math curriculum alignment with new state standards',
          purpose: 'Discussion',
          order_index: 1,
          duration_minutes: 30,
          status: 'Resolved',
          responsible_staff_id: staffMembers[1].id,
          created_at: new Date('2024-03-10'),
          updated_at: new Date('2024-03-10')
        },
        {
          meeting_id: team1Meeting1.id,
          topic: 'English Language Arts Updates',
          problem_statement: 'Proposed changes to ELA curriculum for next academic year',
          purpose: 'Decision',
          order_index: 2,
          duration_minutes: 45,
          status: 'Resolved',
          responsible_staff_id: staffMembers[2].id,
          created_at: new Date('2024-03-10'),
          updated_at: new Date('2024-03-10')
        },
        {
          meeting_id: team1Meeting1.id,
          topic: 'Assessment Strategy Discussion',
          problem_statement: 'Review and update assessment methodologies across all subjects',
          purpose: 'Discussion',
          order_index: 3,
          duration_minutes: 45,
          status: 'Pending',
          responsible_staff_id: staffMembers[0].id,
          created_at: new Date('2024-03-10'),
          updated_at: new Date('2024-03-10')
        }
      ]
    });

    // Create agenda items for Team 1 Meeting 2
    await prisma.meeting_agenda_items.createMany({
      data: [
        {
          meeting_id: team1Meeting2.id,
          topic: 'New Lab Equipment Integration',
          problem_statement: 'Plan for integrating new laboratory equipment into science curriculum',
          purpose: 'Decision',
          order_index: 1,
          duration_minutes: 40,
          status: 'Resolved',
          responsible_staff_id: staffMembers[1].id,
          created_at: new Date('2024-04-15'),
          updated_at: new Date('2024-04-15')
        },
        {
          meeting_id: team1Meeting2.id,
          topic: 'Teacher Training Schedule',
          problem_statement: 'Schedule professional development sessions for science teachers',
          purpose: 'Information_Sharing',
          order_index: 2,
          duration_minutes: 35,
          status: 'Ongoing',
          responsible_staff_id: staffMembers[2].id,
          created_at: new Date('2024-04-15'),
          updated_at: new Date('2024-04-15')
        }
      ]
    });

    // Create meetings for Team 2
    const team2Meeting1 = await prisma.meeting.create({
      data: {
        title: 'EdTech Platform Evaluation',
        description: 'Evaluation of new educational technology platforms for school-wide implementation',
        start_time: new Date('2024-03-25T13:00:00'),
        end_time: new Date('2024-03-25T15:00:00'),
        organizer_id: staffMembers[1].id,
        team_id: team2.id,
        status: 'COMPLETED',
        department_id: staffMembers[1].department_id || 1,
        school_id: staffMembers[1].school_id || 1,
        district_id: staffMembers[1].district_id || 1,
        created_at: new Date('2024-03-20')
      } as any
    });

    // Create agenda items for Team 2
    await prisma.meeting_agenda_items.createMany({
      data: [
        {
          meeting_id: team2Meeting1.id,
          topic: 'Learning Management System Review',
          problem_statement: 'Compare and evaluate different LMS options for district adoption',
          purpose: 'Decision',
          order_index: 1,
          duration_minutes: 45,
          status: 'Resolved',
          responsible_staff_id: staffMembers[1].id,
          created_at: new Date('2024-03-20'),
          updated_at: new Date('2024-03-20')
        },
        {
          meeting_id: team2Meeting1.id,
          topic: 'Digital Citizenship Curriculum',
          problem_statement: 'Develop comprehensive digital citizenship training program',
          purpose: 'Information_Sharing',
          order_index: 2,
          duration_minutes: 30,
          status: 'Ongoing',
          responsible_staff_id: staffMembers[3] ? staffMembers[3].id : staffMembers[0].id,
          created_at: new Date('2024-03-20'),
          updated_at: new Date('2024-03-20')
        }
      ]
    });

    // Create meetings for Team 3
    const team3Meeting1 = await prisma.meeting.create({
      data: {
        title: 'Mental Health Support Program Launch',
        description: 'Planning launch of comprehensive mental health support program for students',
        start_time: new Date('2024-04-05T11:00:00'),
        end_time: new Date('2024-04-05T13:00:00'),
        organizer_id: staffMembers[2].id,
        team_id: team3.id,
        status: 'COMPLETED',
        department_id: staffMembers[2].department_id || 1,
        school_id: staffMembers[2].school_id || 1,
        district_id: staffMembers[2].district_id || 1,
        created_at: new Date('2024-04-01')
      } as any
    });

    // Create agenda items for Team 3
    await prisma.meeting_agenda_items.createMany({
      data: [
        {
          meeting_id: team3Meeting1.id,
          topic: 'Counselor Staffing Review',
          problem_statement: 'Evaluate current counseling staff capacity and needs',
          purpose: 'Discussion',
          order_index: 1,
          duration_minutes: 40,
          status: 'Resolved',
          responsible_staff_id: staffMembers[2].id,
          created_at: new Date('2024-04-01'),
          updated_at: new Date('2024-04-01')
        },
        {
          meeting_id: team3Meeting1.id,
          topic: 'Wellness Program Activities',
          problem_statement: 'Plan weekly wellness activities and stress reduction programs',
          purpose: 'Information_Sharing',
          order_index: 2,
          duration_minutes: 35,
          status: 'Ongoing',
          responsible_staff_id: staffMembers[0].id,
          created_at: new Date('2024-04-01'),
          updated_at: new Date('2024-04-01')
        }
      ]
    });

    // Add meeting attendees
    await prisma.meeting_attendee.createMany({
      data: [
        // Team 1 Meeting 1
        { meeting_id: team1Meeting1.id, staff_id: staffMembers[0].id, status: 'ATTENDED' },
        { meeting_id: team1Meeting1.id, staff_id: staffMembers[1].id, status: 'ATTENDED' },
        { meeting_id: team1Meeting1.id, staff_id: staffMembers[2].id, status: 'ATTENDED' },
        // Team 1 Meeting 2
        { meeting_id: team1Meeting2.id, staff_id: staffMembers[0].id, status: 'ATTENDED' },
        { meeting_id: team1Meeting2.id, staff_id: staffMembers[1].id, status: 'ATTENDED' },
        // Team 2 Meeting 1
        { meeting_id: team2Meeting1.id, staff_id: staffMembers[1].id, status: 'ATTENDED' },
        { meeting_id: team2Meeting1.id, staff_id: staffMembers[3] ? staffMembers[3].id : staffMembers[0].id, status: 'ATTENDED' },
        // Team 3 Meeting 1
        { meeting_id: team3Meeting1.id, staff_id: staffMembers[2].id, status: 'ATTENDED' },
        { meeting_id: team3Meeting1.id, staff_id: staffMembers[0].id, status: 'ATTENDED' }
      ]
    });

    // Add meeting notes
    await prisma.meeting_notes.createMany({
      data: [
        {
          meeting_id: team1Meeting1.id,
          staff_id: staffMembers[0].id,
          content: 'Great discussion on math standards alignment. Need to follow up with department heads on implementation timeline.'
        },
        {
          meeting_id: team2Meeting1.id,
          staff_id: staffMembers[1].id,
          content: 'LMS evaluation complete. Recommendation to proceed with Canvas implementation district-wide.'
        },
        {
          meeting_id: team3Meeting1.id,
          staff_id: staffMembers[2].id,
          content: 'Mental health support program approved. Will start with pilot program in high school before district rollout.'
        }
      ]
    });

    // Add team knowledge resources
    await prisma.team_knowledge.createMany({
      data: [
        {
          id: randomBytes(16).toString('hex'),
          team_id: team1.id,
          title: 'State Curriculum Standards Guide',
          content: 'Comprehensive guide to state curriculum standards and alignment requirements for all subjects.',
          type: 'DOCUMENT',
          category: 'Standards',
          tags: ['curriculum', 'standards', 'alignment'],
          created_by: users[0].id,
          created_by_staff_id: staffMembers[0].id,
          is_pinned: true,
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: randomBytes(16).toString('hex'),
          team_id: team2.id,
          title: 'EdTech Platform Comparison',
          content: 'Detailed comparison of educational technology platforms including features, pricing, and implementation requirements.',
          type: 'DOCUMENT',
          category: 'Technology',
          tags: ['technology', 'platforms', 'comparison'],
          created_by: users[1].id,
          created_by_staff_id: staffMembers[1].id,
          is_pinned: true,
          created_at: new Date('2024-02-15'),
          updated_at: new Date('2024-02-15')
        },
        {
          id: randomBytes(16).toString('hex'),
          team_id: team3.id,
          title: 'Student Wellness Program Framework',
          content: 'Comprehensive framework for implementing student wellness programs including mental health support.',
          type: 'DOCUMENT',
          category: 'Policy',
          tags: ['wellness', 'mental-health', 'framework'],
          created_by: users[2].id,
          created_by_staff_id: staffMembers[2].id,
          is_pinned: true,
          created_at: new Date('2024-03-05'),
          updated_at: new Date('2024-03-05')
        }
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Sample teams data created successfully!',
      summary: {
        teams: 3,
        members: 9,
        meetings: 6,
        agenda_items: 8,
        attendees: 9,
        notes: 3,
        knowledge: 3
      }
    });

  } catch (error) {
    console.error('Error creating sample teams data:', error);
    return NextResponse.json(
      { error: 'Failed to create sample teams data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
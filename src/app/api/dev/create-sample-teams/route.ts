import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

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
    await prisma.meeting_agenda_item.deleteMany();
    await prisma.meeting.deleteMany({ where: { team_id: { not: null } } });
    await prisma.team_members.deleteMany();
    await prisma.teams.deleteMany();

    // Create Team 1: Curriculum Development Team
    const team1 = await prisma.teams.create({
      data: {
        name: 'Curriculum Development Team',
        description: 'Responsible for developing and updating curriculum standards across all grade levels',
        purpose: 'To ensure our curriculum meets state standards and student learning objectives',
        created_by: staffMembers[0].id,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15');
      }
    });

    // Add team members to Team 1
    await prisma.team_members.createMany({
      data: [
        {
          team_id: team1.id,
          staff_id: staffMembers[0].id,
          role: 'LEAD',
          joined_at: new Date('2024-01-15');
        },
        {
          team_id: team1.id,
          staff_id: staffMembers[1].id,
          role: 'MEMBER',
          joined_at: new Date('2024-01-16');
        },
        {
          team_id: team1.id,
          staff_id: staffMembers[2].id,
          role: 'MEMBER',
          joined_at: new Date('2024-01-17');
        }
      ]
    });

    // Create Team 2: Technology Integration Team
    const team2 = await prisma.teams.create({
      data: {
        name: 'Technology Integration Team',
        description: 'Leading digital transformation and technology integration in education',
        purpose: 'To implement and optimize technology solutions for enhanced learning experiences',
        created_by: staffMembers[1].id,
        created_at: new Date('2024-02-01'),
        updated_at: new Date('2024-02-01');
      }
    });

    // Add team members to Team 2
    await prisma.team_members.createMany({
      data: [
        {
          team_id: team2.id,
          staff_id: staffMembers[1].id,
          role: 'LEAD',
          joined_at: new Date('2024-02-01');
        },
        {
          team_id: team2.id,
          staff_id: staffMembers[3] ? staffMembers[3].id : staffMembers[0].id,
          role: 'MEMBER',
          joined_at: new Date('2024-02-02');
        },
        {
          team_id: team2.id,
          staff_id: staffMembers[4] ? staffMembers[4].id : staffMembers[2].id,
          role: 'MEMBER',
          joined_at: new Date('2024-02-03');
        }
      ]
    });

    // Create Team 3: Student Wellness Committee
    const team3 = await prisma.teams.create({
      data: {
        name: 'Student Wellness Committee',
        description: 'Focused on student mental health, physical wellness, and overall well-being',
        purpose: 'To develop and implement comprehensive wellness programs for student success',
        created_by: staffMembers[2].id,
        created_at: new Date('2024-03-01'),
        updated_at: new Date('2024-03-01');
      }
    });

    // Add team members to Team 3
    await prisma.team_members.createMany({
      data: [
        {
          team_id: team3.id,
          staff_id: staffMembers[2].id,
          role: 'LEAD',
          joined_at: new Date('2024-03-01');
        },
        {
          team_id: team3.id,
          staff_id: staffMembers[0].id,
          role: 'MEMBER',
          joined_at: new Date('2024-03-02');
        },
        {
          team_id: team3.id,
          staff_id: staffMembers[5] ? staffMembers[5].id : staffMembers[1].id,
          role: 'MEMBER',
          joined_at: new Date('2024-03-03');
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
        created_at: new Date('2024-03-10'),
        updated_at: new Date('2024-03-15');
      }
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
        created_at: new Date('2024-04-15'),
        updated_at: new Date('2024-04-20');
      }
    });

    // Create agenda items for Team 1 Meeting 1
    await prisma.meeting_agenda_item.createMany({
      data: [
        {
          meeting_id: team1Meeting1.id,
          title: 'Math Standards Alignment Review',
          description: 'Review current math curriculum alignment with new state standards',
          order: 1,
          duration: 30,
          status: 'DISCUSSED',
          responsible_staff_id: staffMembers[1].id,
          created_at: new Date('2024-03-10');
        },
        {
          meeting_id: team1Meeting1.id,
          title: 'English Language Arts Updates',
          description: 'Proposed changes to ELA curriculum for next academic year',
          order: 2,
          duration: 45,
          status: 'APPROVED',
          responsible_staff_id: staffMembers[2].id,
          created_at: new Date('2024-03-10');
        },
        {
          meeting_id: team1Meeting1.id,
          title: 'Assessment Strategy Discussion',
          description: 'Review and update assessment methodologies across all subjects',
          order: 3,
          duration: 45,
          status: 'PENDING',
          responsible_staff_id: staffMembers[0].id,
          created_at: new Date('2024-03-10');
        }
      ]
    });

    // Create agenda items for Team 1 Meeting 2
    await prisma.meeting_agenda_item.createMany({
      data: [
        {
          meeting_id: team1Meeting2.id,
          title: 'New Lab Equipment Integration',
          description: 'Plan for integrating new laboratory equipment into science curriculum',
          order: 1,
          duration: 40,
          status: 'APPROVED',
          responsible_staff_id: staffMembers[1].id,
          created_at: new Date('2024-04-15');
        },
        {
          meeting_id: team1Meeting2.id,
          title: 'Teacher Training Schedule',
          description: 'Schedule professional development sessions for science teachers',
          order: 2,
          duration: 35,
          status: 'IN_PROGRESS',
          responsible_staff_id: staffMembers[2].id,
          created_at: new Date('2024-04-15');
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
        created_at: new Date('2024-03-20'),
        updated_at: new Date('2024-03-25');
      }
    });

    // Create agenda items for Team 2
    await prisma.meeting_agenda_item.createMany({
      data: [
        {
          meeting_id: team2Meeting1.id,
          title: 'Learning Management System Review',
          description: 'Compare and evaluate different LMS options for district adoption',
          order: 1,
          duration: 45,
          status: 'APPROVED',
          responsible_staff_id: staffMembers[1].id,
          created_at: new Date('2024-03-20');
        },
        {
          meeting_id: team2Meeting1.id,
          title: 'Digital Citizenship Curriculum',
          description: 'Develop comprehensive digital citizenship training program',
          order: 2,
          duration: 30,
          status: 'IN_PROGRESS',
          responsible_staff_id: staffMembers[3] ? staffMembers[3].id : staffMembers[0].id,
          created_at: new Date('2024-03-20');
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
        created_at: new Date('2024-04-01'),
        updated_at: new Date('2024-04-05');
      }
    });

    // Create agenda items for Team 3
    await prisma.meeting_agenda_item.createMany({
      data: [
        {
          meeting_id: team3Meeting1.id,
          title: 'Counselor Staffing Review',
          description: 'Evaluate current counseling staff capacity and needs',
          order: 1,
          duration: 40,
          status: 'APPROVED',
          responsible_staff_id: staffMembers[2].id,
          created_at: new Date('2024-04-01');
        },
        {
          meeting_id: team3Meeting1.id,
          title: 'Wellness Program Activities',
          description: 'Plan weekly wellness activities and stress reduction programs',
          order: 2,
          duration: 35,
          status: 'IN_PROGRESS',
          responsible_staff_id: staffMembers[0].id,
          created_at: new Date('2024-04-01');
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
          team_id: team1.id,
          title: 'State Curriculum Standards Guide',
          content: 'Comprehensive guide to state curriculum standards and alignment requirements for all subjects.',
          type: 'GUIDE',
          tags: ['curriculum', 'standards', 'alignment'],
          created_by: users[0].id,
          created_by_staff_id: staffMembers[0].id,
          is_pinned: true,
          views_count: 15,
          downloads_count: 3,
          created_at: new Date('2024-01-20');
        },
        {
          team_id: team2.id,
          title: 'EdTech Platform Comparison',
          content: 'Detailed comparison of educational technology platforms including features, pricing, and implementation requirements.',
          type: 'DOCUMENT',
          tags: ['technology', 'platforms', 'comparison'],
          created_by: users[1].id,
          created_by_staff_id: staffMembers[1].id,
          is_pinned: true,
          views_count: 22,
          downloads_count: 7,
          created_at: new Date('2024-02-15');
        },
        {
          team_id: team3.id,
          title: 'Student Wellness Program Framework',
          content: 'Comprehensive framework for implementing student wellness programs including mental health support.',
          type: 'POLICY',
          tags: ['wellness', 'mental-health', 'framework'],
          created_by: users[2].id,
          created_by_staff_id: staffMembers[2].id,
          is_pinned: true,
          views_count: 18,
          downloads_count: 4,
          created_at: new Date('2024-03-05');
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
import { PrismaClient } from '@prisma/client';
import type { Priority, Purpose, SolutionType, DecisionType, AgendaItemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMCSCSMeetings() {
  try {
    // Get staff members
    const nsStaff = await prisma.staff.findFirst({
      where: { users: { email: 'ns@agendaiq.com' } }
    });
    const acStaff = await prisma.staff.findFirst({
      where: { users: { email: 'ac@agendaiq.com' } }
    });
    const tmStaff = await prisma.staff.findFirst({
      where: { users: { email: 'tm@agendaiq.com' } }
    });

    if (!nsStaff || !acStaff || !tmStaff) {
      console.error("Staff members not found. Please run create-admin.ts first.");
      return;
    }

    const adminDept = await prisma.department.findFirst({
      where: { code: 'ADMIN' }
    });

    if (!adminDept) {
      console.error("Admin department not found.");
      return;
    }

    // Meeting 1: July 28, 2025
    const meeting1 = await prisma.meeting.create({
      data: {
        title: "MCSCS Director Meeting - July 28, 2025",
        description: "Regular director meeting to discuss operational matters",
        start_time: new Date("2025-07-28T09:00:00"),
        end_time: new Date("2025-07-28T11:00:00"),
        meeting_type: "regular",
        status: "completed",
        organizer_id: nsStaff.id,
        department_id: adminDept.id,
        school_id: adminDept.school_id,
        district_id: nsStaff.district_id,
        meeting_attendee: {
          create: [
            { staff_id: nsStaff.id, status: "attended" },
            { staff_id: acStaff.id, status: "attended" },
            { staff_id: tmStaff.id, status: "attended" }
          ]
        },
        meeting_agenda_items: {
          create: [
            {
              topic: "Meeting Scope",
              problem_statement: "asd",
              staff_initials: "NS",
              responsible_staff_id: nsStaff.id,
              priority: "Medium" as Priority,
              purpose: "Discussion" as Purpose,
              proposed_solution: "",
              solution_type: "Technical" as SolutionType,
              decisions_actions: "Possible topics:\nEnrollment\nChronic Absenteeism\nAcademic Needs for MCSCS\nMarketing\nHR matters at MCSCS\nPotential changes in policies or procedures\nAny local issue that involves Sercan or shouldn't be discussed in local meeting",
              decision_type: "Technical" as DecisionType,
              status: "Resolved" as AgendaItemStatus,
              future_implications: false,
              order_index: 0,
              updated_at: new Date()
            },
            {
              topic: "Meeting Norms",
              problem_statement: "asdf",
              staff_initials: "NS",
              responsible_staff_id: nsStaff.id,
              priority: "Medium" as Priority,
              purpose: "Information_Sharing" as Purpose,
              proposed_solution: "",
              solution_type: "Adaptive" as SolutionType,
              decisions_actions: "Maintain professionalism when discussing matters\nTransparency with one another - should not hide or cover anything up to best define problem and think of solutions\nAnything discussed should stay here\nCan discuss any urgent matter and reach out to Sercan outside of meeting times\nCome prepared - put things on agenda and propose solutions",
              decision_type: "Adaptive" as DecisionType,
              status: "Resolved" as AgendaItemStatus,
              future_implications: false,
              order_index: 1,
              updated_at: new Date()
            },
            {
              topic: "Dismissal Time",
              problem_statement: "Bus and Parent Pick-up",
              staff_initials: "AC",
              responsible_staff_id: acStaff.id,
              priority: "Medium" as Priority,
              purpose: "Decision" as Purpose,
              proposed_solution: "staggered timing",
              solution_type: "Both" as SolutionType,
              decisions_actions: "Dismiss bus students first, keep car riders in class, have further discussion with teachers",
              decision_type: "Adaptive" as DecisionType,
              status: "Assigned_to_local" as AgendaItemStatus,
              future_implications: false,
              order_index: 2,
              updated_at: new Date()
            },
            {
              topic: "Intervention Plan",
              problem_statement: "asfdasdf",
              staff_initials: "TM",
              responsible_staff_id: tmStaff.id,
              priority: "High" as Priority,
              purpose: "Discussion" as Purpose,
              proposed_solution: "Proposal",
              solution_type: "Adaptive" as SolutionType,
              decisions_actions: "Come up with time intervals to provide accountability metric - need to understand if programming is working effectively\nPost-test - must be standard and pushed out by admin and then evaluated\n\nSercan will review the plan and provide feedback",
              decision_type: "Adaptive" as DecisionType,
              status: "Assigned_to_local" as AgendaItemStatus,
              future_implications: false,
              order_index: 3,
              updated_at: new Date()
            },
            {
              topic: "College Counselling",
              problem_statement: "Instilling college mindset",
              staff_initials: "NS",
              responsible_staff_id: nsStaff.id,
              priority: "Medium" as Priority,
              purpose: "Decision" as Purpose,
              proposed_solution: "Plan events and programs for students and for parents to bring awareness. Supplemental programs",
              solution_type: "Adaptive" as SolutionType,
              decisions_actions: "Deneme 1",
              decision_type: "Adaptive" as DecisionType,
              status: "Assigned_to_local" as AgendaItemStatus,
              future_implications: false,
              order_index: 4,
              updated_at: new Date()
            },
            {
              topic: "Aftercare",
              problem_statement: "Freze on asisistance CCS",
              staff_initials: "NS",
              responsible_staff_id: nsStaff.id,
              priority: "Medium" as Priority,
              purpose: "Decision" as Purpose,
              proposed_solution: "Offer late pick up untill 4:15 pm",
              solution_type: "Both" as SolutionType,
              decisions_actions: "Deneme 2",
              decision_type: "Technical" as DecisionType,
              status: "Assigned_to_local" as AgendaItemStatus,
              future_implications: false,
              order_index: 5,
              updated_at: new Date()
            }
          ]
        }
      }
    });

    // Meeting 2: August 4, 2025
    const meeting2 = await prisma.meeting.create({
      data: {
        title: "MCSCS Director Meeting - August 4, 2025",
        description: "Follow-up director meeting",
        start_time: new Date("2025-08-04T09:00:00"),
        end_time: new Date("2025-08-04T11:00:00"),
        meeting_type: "regular",
        status: "scheduled",
        organizer_id: nsStaff.id,
        department_id: adminDept.id,
        school_id: adminDept.school_id,
        district_id: nsStaff.district_id,
        meeting_attendee: {
          create: [
            { staff_id: nsStaff.id, status: "pending" },
            { staff_id: acStaff.id, status: "pending" },
            { staff_id: tmStaff.id, status: "pending" }
          ]
        },
        meeting_agenda_items: {
          create: [
            {
              topic: "Attandance",
              problem_statement: "No dedicated personnel",
              staff_initials: "AC",
              responsible_staff_id: acStaff.id,
              priority: "Medium" as Priority,
              purpose: "Decision" as Purpose,
              proposed_solution: "Plan B?",
              solution_type: "Adaptive" as SolutionType,
              decisions_actions: "Deneme 3",
              decision_type: "Technical" as DecisionType,
              status: "Ongoing" as AgendaItemStatus,
              future_implications: false,
              order_index: 0,
              updated_at: new Date()
            },
            {
              topic: "Transportation",
              problem_statement: "sadsdsd",
              staff_initials: "TM",
              responsible_staff_id: tmStaff.id,
              priority: "Medium" as Priority,
              purpose: "Information_Sharing" as Purpose,
              proposed_solution: "fdsdfsdf",
              solution_type: "Technical" as SolutionType,
              decisions_actions: "Deneme 4",
              decision_type: "Technical" as DecisionType,
              status: "Resolved" as AgendaItemStatus,
              future_implications: false,
              order_index: 1,
              updated_at: new Date()
            },
            {
              topic: "Contact Information",
              problem_statement: "School Messenger Fix",
              staff_initials: "NS",
              responsible_staff_id: nsStaff.id,
              priority: "High" as Priority,
              purpose: "Reminder" as Purpose,
              proposed_solution: "sdvsd",
              solution_type: "Both" as SolutionType,
              decisions_actions: "Deneme 5",
              decision_type: "Both" as DecisionType,
              status: "Ongoing" as AgendaItemStatus,
              future_implications: false,
              order_index: 2,
              updated_at: new Date()
            },
            {
              topic: "Phone system",
              problem_statement: "thrrthfg",
              staff_initials: "NS",
              responsible_staff_id: nsStaff.id,
              priority: "Low" as Priority,
              purpose: "Reminder" as Purpose,
              proposed_solution: "sdfsdf",
              solution_type: "Technical" as SolutionType,
              decisions_actions: "Deneme 6",
              decision_type: "Both" as DecisionType,
              status: "Ongoing" as AgendaItemStatus,
              future_implications: false,
              order_index: 3,
              updated_at: new Date()
            }
          ]
        }
      }
    });

    console.log("✅ MCSCS sample meetings created successfully!");
    console.log(`Meeting 1 ID: ${meeting1.id} (July 28, 2025 - Completed)`);
    console.log(`Meeting 2 ID: ${meeting2.id} (August 4, 2025 - Scheduled)`);

  } catch (error) {
    console.error("Error creating sample meetings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMCSCSMeetings();
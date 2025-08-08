import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Create districts
    const district1 = await prisma.district.create({
      data: {
        name: "MCSCS District",
        code: "MCSCS",
        address: "123 Main St, City, State"
      }
    });

    // Create schools
    const school1 = await prisma.school.create({
      data: {
        name: "MCSCS Main Campus",
        code: "MAIN",
        address: "123 Main St",
        district_id: district1.id
      }
    });

    // Create departments
    const adminDept = await prisma.department.create({
      data: {
        name: "Administration",
        code: "ADMIN",
        school_id: school1.id
      }
    });

    const academicDept = await prisma.department.create({
      data: {
        name: "Academic Affairs",
        code: "ACAD",
        school_id: school1.id
      }
    });

    const operationsDept = await prisma.department.create({
      data: {
        name: "Operations",
        code: "OPS",
        school_id: school1.id
      }
    });

    // Create roles
    const adminRole = await prisma.role.create({
      data: {
        title: "Administrator",
        priority: 1,
        is_leadership: true,
        category: "Leadership"
      }
    });

    const directorRole = await prisma.role.create({
      data: {
        title: "Director",
        priority: 2,
        is_leadership: true,
        category: "Leadership"
      }
    });

    const managerRole = await prisma.role.create({
      data: {
        title: "Manager",
        priority: 3,
        is_leadership: true,
        category: "Management"
      }
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash("Admin123!", 10);
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@agendaiq.com",
        name: "System Administrator",
        hashedPassword,
        emailVerified: new Date(),
        is_admin: true
      }
    });

    // Create admin staff record
    const adminStaff = await prisma.staff.create({
      data: {
        user_id: adminUser.id,
        department_id: adminDept.id,
        role_id: adminRole.id,
        school_id: school1.id,
        district_id: district1.id,
        flags: ["verified", "active"],
        endorsements: ["full_access"]
      }
    });

    // Create test directors
    const nsUser = await prisma.user.create({
      data: {
        email: "ns@agendaiq.com",
        name: "NS",
        hashedPassword,
        emailVerified: new Date()
      }
    });

    const nsStaff = await prisma.staff.create({
      data: {
        user_id: nsUser.id,
        department_id: adminDept.id,
        role_id: directorRole.id,
        school_id: school1.id,
        district_id: district1.id,
        flags: ["verified", "active"]
      }
    });

    const acUser = await prisma.user.create({
      data: {
        email: "ac@agendaiq.com",
        name: "AC",
        hashedPassword,
        emailVerified: new Date()
      }
    });

    const acStaff = await prisma.staff.create({
      data: {
        user_id: acUser.id,
        department_id: academicDept.id,
        role_id: directorRole.id,
        school_id: school1.id,
        district_id: district1.id,
        flags: ["verified", "active"]
      }
    });

    const tmUser = await prisma.user.create({
      data: {
        email: "tm@agendaiq.com",
        name: "TM",
        hashedPassword,
        emailVerified: new Date()
      }
    });

    const tmStaff = await prisma.staff.create({
      data: {
        user_id: tmUser.id,
        department_id: operationsDept.id,
        role_id: directorRole.id,
        school_id: school1.id,
        district_id: district1.id,
        flags: ["verified", "active"]
      }
    });

    console.log("✅ Admin and test users created successfully!");
    console.log("Admin login: admin@agendaiq.com / Admin123!");
    console.log("Director logins: ns@agendaiq.com, ac@agendaiq.com, tm@agendaiq.com / Admin123!");

  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
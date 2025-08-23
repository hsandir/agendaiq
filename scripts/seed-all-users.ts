#!/usr/bin/env ts-node
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface UserSeedData {
  email: string;
  name: string;
  password?: string;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
}

async function seedUsers() {
  console.log("🌱 Starting user seed...");

  const users: UserSeedData[] = [
    // Admin user from seed.js
    {
      email: "admin@school.edu",
      name: "Admin User",
      password: "admin123",
      is_system_admin: true,
      is_school_admin: true
    },
    // System admin from seed-cjcp-complete.ts
    {
      email: "sysadmin@cjcollegeprep.org",
      name: "System Administrator",
      password: "admin123",
      is_system_admin: true,
      is_school_admin: false
    },
    // Leadership users from seed-cjcp-complete.ts
    {
      email: "nsercan@cjcollegeprep.org",
      name: "Dr. Namik Sercan",
      password: "admin123",
      is_system_admin: false,
      is_school_admin: true
    },
    {
      email: "namin@cjcollegeprep.org",
      name: "Ms. Nima Amin",
      password: "admin123"
    },
    {
      email: "manar@cjcollegeprep.org",
      name: "Mr. Anar",
      password: "admin123"
    },
    {
      email: "sba@cjcollegeprep.org",
      name: "Ms. Daubon",
      password: "admin123"
    },
    {
      email: "cthomas@cjcollegeprep.org",
      name: "Ms. Thomas",
      password: "admin123"
    },
    {
      email: "fbrown@cjcollegeprep.org",
      name: "Ms. Brown",
      password: "admin123"
    },
    {
      email: "lmignogno@cjcollegeprep.org",
      name: "Ms. Mignogno",
      password: "admin123"
    },
    {
      email: "skaeli@cjcollegeprep.org",
      name: "Ms. Kaeli",
      password: "admin123"
    },
    {
      email: "vsuslu@cjcollegeprep.org",
      name: "Mr. Bright",
      password: "admin123"
    },
    {
      email: "bgrossmann@cjcollegeprep.org",
      name: "Ms. Grossmann",
      password: "admin123"
    },
    {
      email: "dvesper@cjcollegeprep.org",
      name: "Dr. Vesper",
      password: "admin123"
    },
    {
      email: "mfirsichbaum@cjcollegeprep.org",
      name: "Ms. Firsichbaum",
      password: "admin123"
    },
    {
      email: "amygettelfinger@cjcollegeprep.org",
      name: "Ms. Gettelfinger",
      password: "admin123"
    },
    {
      email: "cmathews@cjcollegeprep.org",
      name: "Dr. Mathews",
      password: "admin123"
    },
    {
      email: "fbarker@cjcollegeprep.org",
      name: "Ms. Brown",
      password: "admin123"
    },
    {
      email: "mgibbs@cjcollegeprep.org",
      name: "Ms. Gibbs",
      password: "admin123"
    },
    {
      email: "ktemplasky@cjcollegeprep.org",
      name: "Mr. Tempalsky",
      password: "admin123"
    },
    {
      email: "tsalley@cjcollegeprep.org",
      name: "Ms. Salley",
      password: "admin123"
    },
    {
      email: "pespinoza@cjcollegeprep.org",
      name: "Ms. Espinoza",
      password: "admin123"
    }
  ];

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const userData of users) {
    try {
      const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;
      
      const existing = await prisma.users.findUnique({
        where: { email: userData.email }
      });

      if (existing) {
        // Update existing user
        await prisma.users.update({
          where: { email: userData.email },
          data: {
            name: userData.name,
            ...(hashedPassword && { hashed_password: hashedPassword }),
            ...(userData.is_system_admin !== undefined && { is_system_admin: userData.is_system_admin }),
            ...(userData.is_school_admin !== undefined && { is_school_admin: userData.is_school_admin }),
            updated_at: new Date()
          }
        });
        console.log(`✅ Updated user: ${userData.email}`);
        updated++;
      } else {
        // Create new user
        await prisma.users.create({
          data: {
            email: userData.email,
            name: userData.name,
            hashed_password: hashedPassword,
            email_verified: new Date(),
            is_system_admin: userData.is_system_admin ?? false,
            is_school_admin: userData.is_school_admin ?? false,
            two_factor_enabled: false,
            updated_at: new Date()
          }
        });
        console.log(`✅ Created user: ${userData.email}`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error processing user ${userData.email}:`, error);
      errors++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Created: ${created} users`);
  console.log(`   Updated: ${updated} users`);
  console.log(`   Errors: ${errors}`);
  
  console.log("\n🔐 Login Credentials:");
  console.log("   Admin: admin@school.edu / admin123");
  console.log("   System Admin: sysadmin@cjcollegeprep.org / admin123");
  console.log("   All other users: [email] / admin123");
}

seedUsers()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
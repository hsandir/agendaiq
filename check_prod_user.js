const { PrismaClient } = require('@prisma/client');

async function checkUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
      }
    }
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'hs@test.com' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true
          }
        }
      }
    });

    if (user) {
      console.log('User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
        isActive: user.is_active,
        staff: user.Staff ? {
          role: user.Staff.Role?.title,
          department: user.Staff.Department?.name
        } : null
      });
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');

    // Hash new password "1234"
    const hashedPassword = await bcrypt.hash('1234', 12);

    // Update admin user
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@school.edu' },
      data: { hashedPassword }
    });

    console.log('✅ Admin password reset successfully!');
    console.log('Email:', updatedUser.email);
    console.log('New hash:', hashedPassword);

    // Verify the password works
    const isValid = await bcrypt.compare('1234', hashedPassword);
    console.log('Password verification:', isValid);

  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword(); 
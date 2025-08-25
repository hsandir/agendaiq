import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@agendaiq.app';
    const password = 'Test123!';
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('User already exists:', email);
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { 
          hashedPassword,
          is_system_admin: true,
          is_admin: true,
          is_school_admin: true
        }
      });
      console.log('Password updated for:', email);
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name: 'Test User',
          hashedPassword,
          is_system_admin: true,
          is_admin: true,
          is_school_admin: true
        }
      });
      console.log('User created:', user.email);
    }
    
    console.log('\nYou can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
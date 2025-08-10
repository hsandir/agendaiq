import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// TEMPORARY TEST PAGE - DELETE AFTER DEBUGGING
export default async function TestLoginPage() {
  let result: any = {};
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    result.dbConnected = true;
    
    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      select: {
        id: true,
        email: true,
        hashedPassword: true,
        two_factor_enabled: true
      }
    });
    
    if (user) {
      result.userFound = true;
      result.email = user.email;
      result.hasPassword = !!user.hashedPassword;
      result.twoFactorEnabled = user.two_factor_enabled;
      
      if (user.hashedPassword) {
        // Test password
        const isValid = await bcrypt.compare('1234', user.hashedPassword);
        result.passwordValid = isValid;
        result.hashLength = user.hashedPassword.length;
        
        // Show first 10 chars of hash for debugging
        result.hashPreview = user.hashedPassword.substring(0, 10) + '...';
      }
    } else {
      result.userFound = false;
      
      // Show sample users
      const users = await prisma.user.findMany({
        take: 3,
        select: { email: true }
      });
      result.sampleUsers = users.map(u => u.email);
    }
    
  } catch (error: any) {
    result.error = error.message;
  }
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login Debug Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
      <div className="mt-4 text-sm text-gray-600">
        <p>Environment:</p>
        <ul>
          <li>NODE_ENV: {process.env.NODE_ENV}</li>
          <li>NEXTAUTH_URL: {process.env.NEXTAUTH_URL}</li>
          <li>DATABASE_URL exists: {!!process.env.DATABASE_URL}</li>
        </ul>
      </div>
    </div>
  );
}
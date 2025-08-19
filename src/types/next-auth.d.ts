import 'next-auth';
// // import { Role, Department } // Unused imports commented out // Unused imports commented out from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string; // NextAuth requires string ID
    email: string;
    name?: string | null;
    staff?: {
      id: number;
      role: { 
        title: string;
        is_leadership: boolean;
      };
      department: { name: string };
      school: { name: string };
    };
    rememberDevices?: boolean;
  }

  interface Session {
    user: _AuthenticatedUser & {
      id: string; // Keep consistent with User interface
      staff?: {
        id: number;
        role: { 
          title: string;
          is_leadership: boolean;
        };
        department: { name: string };
        school: { name: string };
      };
    };
    rememberDevices?: boolean;
    currentDeviceId?: string;
    trustDevice?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    staff?: {
      id: number;
      role: { title: string };
      department: { name: string };
      school: { name: string };
    };
  }
} 
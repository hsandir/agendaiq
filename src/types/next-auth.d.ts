import 'next-auth';
// // import { Role, Department } // Unused imports commented out // Unused imports commented out from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: number;
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
    user: AuthenticatedUser & {
      id: number;
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
    id: number;
    staff?: {
      id: number;
      role: { title: string };
      department: { name: string };
      school: { name: string };
    };
  }
} 
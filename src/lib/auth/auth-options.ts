import type { NextAuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// Type guard for staff property
function hasStaff(user: unknown): user is User & { staff: unknown } {
  return typeof user === 'object' && user !== null && 'staff' in user && user.staff !== undefined;
}

// Type guard for token with staff
function hasStaffToken(token: unknown): token is JWT & { staff: unknown } {
  return typeof token === 'object' && token !== null && 'staff' in token && token.staff !== undefined;
}

// Type guard for user data
function isValidUserData(data: unknown): data is User {
  return typeof data === 'object' && data !== null && typeof (data as any).id === 'number' && typeof (data as any).email === 'string';
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        try {
          console.log('🔐 Authorize called with:', { email: credentials?.email, hasPassword: !!credentials?.password });
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials');
            throw new Error("Missing credentials");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              Staff: {
                include: {
                  Role: true,
                  Department: true,
                  School: true
                }
              }
            }
          });

          console.log('🔍 User found:', !!user, 'Has password:', !!user?.hashedPassword);

          if (!user || !user.hashedPassword) {
            console.log('❌ Invalid credentials - user not found or no password');
            throw new Error("Invalid credentials");
          }

          // Check password using bcrypt
          const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
          console.log('🔐 Password valid:', isValid);
          
          if (!isValid) {
            console.log('❌ Invalid credentials - password mismatch');
            throw new Error("Invalid credentials");
          }

          const staff = user.Staff[0];
          const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            ...(staff && { 
              staff: {
                id: staff.id,
                role: {
                  id: staff.Role.id,
                  title: staff.Role.title,
                  priority: staff.Role.priority,
                  category: staff.Role.category,
                  is_leadership: staff.Role.is_leadership
                },
                department: {
                  id: staff.Department.id,
                  name: staff.Department.name,
                  code: staff.Department.code
                },
                school: {
                  id: staff.School.id,
                  name: staff.School.name,
                  code: staff.School.code
                }
              }
            })
          };

          console.log('✅ User authenticated:', userData.email);
          return userData;
        } catch (error) {
          console.error('❌ Authorization error:', error instanceof Error ? error.message : String(error));
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign in, check if user exists
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });

        // If it's the first user ever, make them admin
        if (!existingUser) {
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            // This will be the first user, they'll get admin privileges when created
            return true;
          }
          // For subsequent Google users, they need to be invited/added through the admin interface
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (hasStaff(user)) {
          token.staff = user.staff;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      if (hasStaffToken(token)) {
        session.user.staff = token.staff;
      }
      return session;
    },
  },
}; 
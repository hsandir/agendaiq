import type { NextAuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { RateLimiters, getClientIdentifier } from "@/lib/utils/rate-limit";
import { AuditClient } from '@/lib/audit/audit-client';

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
  return typeof data === 'object' && 
         data !== null && 
         typeof (data as { id?: unknown }).id === 'number' && 
         typeof (data as { email?: unknown }).email === 'string';
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
      async authorize(credentials, req): Promise<User | null> {
        try {
          // TODO: Add proper audit logging for NextAuth callbacks
          // Log login attempt
          // await AuditClient.logAuthEvent('login_attempt', undefined, undefined, req);

          if (!credentials?.email || !credentials?.password) {
            // await AuditClient.logSecurityEvent('login_missing_credentials', undefined, undefined, req, 'Missing email or password');
            throw new Error("Missing credentials");
          }

          // Rate limiting for authentication attempts
          if (req) {
            // Create a Request-like object for rate limiting
            const clientIp = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';
            const clientId = `${clientIp}:${userAgent.slice(0, 50)}`;
            
            // Create a minimal Request object for rate limiting
            const requestForRateLimit = new Request('http://localhost:3000/api/auth/signin', {
              method: 'POST',
              headers: {
                'x-forwarded-for': clientIp as string,
                'user-agent': userAgent as string
              }
            });
            
            const rateLimitResult = await RateLimiters.auth.check(requestForRateLimit, 5, clientId); // 5 attempts per 15 minutes
            
            if (!rateLimitResult.success) {
              // await AuditClient.logSecurityEvent('login_rate_limited', undefined, undefined, req, `Rate limit exceeded: ${clientId}`);
              throw new Error(rateLimitResult.error || "Too many login attempts. Please try again later.");
            }
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

          if (!user || !user.hashedPassword) {
            // await AuditClient.logAuthEvent('login_failure', undefined, undefined, req, 'User not found or no password');
            throw new Error("Invalid credentials");
          }

          // Check password using bcrypt
          const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
          
          if (!isValid) {
            // await AuditClient.logAuthEvent('login_failure', user.id, user.Staff[0]?.id, req, 'Password mismatch');
            throw new Error("Invalid credentials");
          }

          const staff = user.Staff[0];
          const userData = {
            id: user.id.toString(), // NextAuth expects string id
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

          // Log successful login
          // await AuditClient.logAuthEvent('login_success', userData.id, staff?.id, req);
          
          return userData;
        } catch (error) {
          console.error('❌ Authorization error:', error instanceof Error ? error.message : String(error));
          
          // Log authentication error
          // await AuditClient.logSecurityEvent('auth_error', undefined, undefined, req, error instanceof Error ? error.message : 'Unknown error');
          
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
        token.id = user.id; // Keep as string for NextAuth compatibility
        if (hasStaff(user)) {
          token.staff = user.staff;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = parseInt(token.id); // Convert string back to number for app usage
      }
      if (hasStaffToken(token)) {
        session.user.staff = token.staff;
      }
      return session;
    },
  },
}; 
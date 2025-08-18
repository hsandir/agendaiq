import type { NextAuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import { RateLimiters, getClientIdentifier } from "@/lib/utils/rate-limit";
import { AuditClient } from '@/lib/audit/audit-client';
import { getUserCapabilities } from '@/lib/auth/policy';

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
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Still using JWT even with adapter
    maxAge: 30 * 24 * 60 * 60, // 30 days default (will be overridden by JWT callback for non-remember-me)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days for JWT token itself
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text", optional: true },
        rememberMe: { label: "Remember Me", type: "text", optional: true },
        trustDevice: { label: "Trust Device", type: "text", optional: true },
      },
      async authorize(credentials, req): Promise<User | null> {
        console.log('🔐 Login attempt for:', credentials?.email);
        try {
          // TODO: Add proper audit logging for NextAuth callbacks
          // Log login attempt
          // await AuditClient.logAuthEvent('login_attempt', undefined, undefined, req);

          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials');
            // await AuditClient.logSecurityEvent('login_missing_credentials', undefined, undefined, req, 'Missing email or password');
            throw new Error("MISSING_CREDENTIALS|Email and password are required");
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
              throw new Error("RATE_LIMITED|" + (rateLimitResult.error || "Too many login attempts. Please try again later"));
            }
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              Staff: {
                include: {
                  Role: true,
                  Department: true,
                  School: true,
                  District: true
                }
              }
            }
          });

          if (!user) {
            console.error('User not found:', credentials.email);
            throw new Error("USER_NOT_FOUND|No account found with this email address");
          }
          
          if (!user.hashedPassword) {
            console.error('User has no password:', credentials.email);
            throw new Error("NO_PASSWORD|Account exists but password not set. Please reset your password");
          }

          // Check password using bcrypt
          console.log('Checking password for user:', user.email);
          const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
          console.log('Password valid:', isValid);
          
          if (!isValid) {
            console.error('Invalid password for user:', user.email);
            // await AuditClient.logAuthEvent('login_failure', user.id, user.Staff[0]?.id, req, 'Password mismatch');
            throw new Error("INVALID_PASSWORD|The password you entered is incorrect");
          }

          // Check 2FA if enabled
          if (user.two_factor_enabled) {
            if (!credentials.twoFactorCode) {
              throw new Error("2FA_REQUIRED");
            }

            // Verify the 2FA code
            const isValidToken = speakeasy.totp.verify({
              secret: user.two_factor_secret!,
              encoding: 'base32',
              token: credentials.twoFactorCode,
              window: 2
            });

            // Check backup codes if TOTP fails
            if (!isValidToken) {
              const isBackupCode = user.backup_codes.includes(credentials.twoFactorCode);
              
              if (!isBackupCode) {
                // await AuditClient.logAuthEvent('login_failure', user.id, user.Staff[0]?.id, req, '2FA code invalid');
                throw new Error("INVALID_2FA|The 2FA code you entered is invalid or expired");
              }

              // Remove used backup code
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  backup_codes: user.backup_codes.filter(code => code !== credentials.twoFactorCode)
                }
              });
            }
          }

          const staff = user.Staff[0];
          const userData = {
            id: String(user.id), // Ensure string conversion for NextAuth
            email: user.email,
            name: user.name || user.email,
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
                },
                district: {
                  id: staff.District.id,
                  name: staff.District.name,
                  code: staff.District.code
                }
              }
            })
          };

          // Log successful login
          // await AuditClient.logAuthEvent('login_success', userData.id, staff?.id, req);
          
          // Add rememberMe flag to user data
          if (credentials.rememberMe === 'true') {
            (userData as any).rememberMe = true;
          }
          if (credentials.trustDevice === 'true') {
            (userData as any).trustDevice = true;
          }
          
          return userData;
        } catch (error) {
          console.error('❌ Authorization error:', error instanceof Error ? error.message : String(error));
          console.error('Full error stack:', error instanceof Error ? error.stack : 'No stack');
          
          // Log authentication error
          // await AuditClient.logSecurityEvent('auth_error', undefined, undefined, req, error instanceof Error ? error.message : 'Unknown error');
          
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign in, check domain allowlist
      if (account?.provider === "google") {
        // Domain allowlist
        const allowedDomains = process.env.ALLOWED_OAUTH_DOMAINS?.split(',') || [
          'cjcollegeprep.org',
          'school.edu'
        ];
        
        const userDomain = user.email?.split('@')[1];
        if (!userDomain || !allowedDomains.includes(userDomain)) {
          // Domain not allowed
          return '/auth/signin?error=unauthorized_domain';
        }

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
          
          // Check if there's an existing credentials account
          // This prevents OAuth takeover of credentials accounts
          const credentialsUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { Account: true }
          });
          
          if (credentialsUser && !credentialsUser.Account?.some(a => a.provider === 'google')) {
            // User exists with credentials, needs to link accounts manually
            return '/auth/signin?error=account_linking_required';
          }
          
          // New OAuth user - can be created but with limited permissions
          // Admin approval may be required (handled in user creation)
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // When user signs in (initial JWT creation)
      if (user) {
        token.id = user.id.toString(); // Convert to string for JWT
        if (hasStaff(user)) {
          token.staff = user.staff;
        }
        
        // Handle rememberMe and trustDevice flags
        if ((user as any).rememberMe) {
          token.rememberMe = true;
          // Set longer expiry for remember me (30 days)
          const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
          token.exp = Math.floor(Date.now() / 1000) + maxAge;
        } else {
          // Default session expiry (1 day)
          const maxAge = 24 * 60 * 60; // 1 day in seconds
          token.exp = Math.floor(Date.now() / 1000) + maxAge;
        }
        
        if ((user as any).trustDevice) {
          token.trustDevice = true;
        }
      }
      
      // Fetch complete user info including capabilities
      // PERFORMANCE: Only fetch on signIn, NOT on every update
      // Capabilities are cached in the JWT token after initial sign-in
      if (token.email && trigger === 'signIn') {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            include: {
              Staff: {
                include: {
                  Role: {
                    include: {
                      Permissions: true
                    }
                  },
                  Department: true,
                  School: true,
                  District: true
                }
              }
            }
          });
          
          if (dbUser) {
            // Add admin flags
            token.is_system_admin = dbUser.is_system_admin;
            token.is_school_admin = dbUser.is_school_admin;
            
            // Get and add capabilities
            const capabilities = await getUserCapabilities(dbUser.id);
            token.capabilities = capabilities;
            
            // Add staff info if available
            if (dbUser.Staff && dbUser.Staff.length > 0) {
              const staff = dbUser.Staff[0];
              token.staff = {
                id: staff.id,
                role: {
                  key: staff.Role.key,
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
                },
                district: {
                  id: staff.District.id,
                  name: staff.District.name,
                  code: staff.District.code
                }
              } as any;
            }
          }
        } catch (error) {
          console.error('Error fetching user info for JWT:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id; // Keep as string
      }
      if (hasStaffToken(token)) {
        session.user.staff = token.staff;
      }
      // Add admin flags and capabilities to session
      session.user.is_system_admin = token.is_system_admin as boolean;
      session.user.is_school_admin = token.is_school_admin as boolean;
      session.user.capabilities = token.capabilities as string[];
      
      // Handle remember me expiry
      if (token.rememberMe) {
        // Extend session for remember me users
        session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      }
      
      return session;
    },
  },
}; 
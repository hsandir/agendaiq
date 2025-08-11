# 🎯 AGENDAIQ MASTER RULES - SINGLE SOURCE OF TRUTH

**LAST UPDATED**: 2024-08-11
**PRIORITY**: This file supersedes all other rule files when conflicts arise

## 📋 RULE HIERARCHY

1. **THIS FILE** (`.claude/MASTER_RULES.md`) - Highest priority
2. `CLAUDE.md` - Claude AI specific guidelines
3. `.cursorrules` - Development standards
4. `.cursor/rules/first` & `.cursor/rules/first.mdc` - Operational constraints
5. Agent-specific rules in `.claude/agents/`

## 🔐 AUTHENTICATION SYSTEM (CURRENT - CAPABILITY BASED)

### ✅ CORRECT AUTH SYSTEM (USE THIS)

#### 1. RoleKey System (Database)
```typescript
// Role.key field in database - System roles + numeric organizational roles
enum RoleKey {
  // System Roles (fixed, universal across all organizations)
  DEV_ADMIN = 'DEV_ADMIN',    // System Developer (highest system privilege)
  OPS_ADMIN = 'OPS_ADMIN',    // Operations Administrator
  
  // Organizational Roles (numeric, meaning varies by organization)
  ROLE_1 = 'ROLE_1',    // Priority 1 - e.g., CEO/Superintendent/Chief Executive
  ROLE_2 = 'ROLE_2',    // Priority 2 - e.g., COO/Chief Operations
  ROLE_3 = 'ROLE_3',    // Priority 3 - e.g., Director/Principal
  ROLE_4 = 'ROLE_4',    // Priority 4 - e.g., Vice Director/Vice Principal
  ROLE_5 = 'ROLE_5',    // Priority 5 - e.g., Manager/Department Head
  ROLE_6 = 'ROLE_6',    // Priority 6 - e.g., Assistant Manager
  ROLE_7 = 'ROLE_7',    // Priority 7 - e.g., Team Lead/Lead Teacher
  ROLE_8 = 'ROLE_8',    // Priority 8 - e.g., Senior Member/Teacher
  ROLE_9 = 'ROLE_9',    // Priority 9 - e.g., Member/Staff
  ROLE_10 = 'ROLE_10',  // Priority 10 - e.g., Junior/Support Staff
}

// IMPORTANT: 
// - DEV_ADMIN and OPS_ADMIN are system-level, same meaning everywhere
// - ROLE_1 to ROLE_10 are organization-specific
// - Lower number = higher authority (ROLE_1 > ROLE_10)
// - Each organization defines what ROLE_X means for them
```

#### 2. Capability System (Permissions)
```typescript
// Use capabilities for fine-grained access control
import { Capability } from '@/lib/auth/policy';

// Examples:
Capability.DEV_DEBUG      // Development access
Capability.OPS_MONITORING // Operations monitoring
Capability.USER_MANAGE    // User management
Capability.MEETING_CREATE // Meeting creation
```

#### 3. Page Authentication (Server Components)
```typescript
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';

// CORRECT PATTERNS:
const user = await requireAuth(AuthPresets.requireAuth);        // Basic auth
const user = await requireAuth(AuthPresets.requireStaff);      // Staff required
const user = await requireAuth(AuthPresets.requireDevAdmin);   // Dev admin
const user = await requireAuth(AuthPresets.requireOpsAdmin);   // Ops admin
const user = await requireAuth(AuthPresets.requireMonitoring); // Monitoring capability

// Or with custom capabilities:
const user = await requireAuth({ 
  requireAuth: true,
  requireCapability: Capability.MEETING_CREATE 
});
```

#### 4. API Authentication
```typescript
import { withAuth } from '@/lib/auth/api-auth';

// CORRECT API PATTERNS:
const authResult = await withAuth(request, {
  requireCapability: Capability.USER_MANAGE
});

// Or with multiple capabilities (OR logic):
const authResult = await withAuth(request, {
  requireCapability: [Capability.DEV_DEBUG, Capability.OPS_MONITORING]
});

// Check result:
if (!authResult.success) {
  return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
}
const user = authResult.user!;
```

#### 5. Admin Checks
```typescript
import { isDevAdmin, isOpsAdmin, can } from '@/lib/auth/policy';

// Check if user is admin:
if (isDevAdmin(user)) { /* Dev admin access */ }
if (isOpsAdmin(user)) { /* Ops admin access */ }

// Check specific capability:
if (can(user, Capability.MEETING_CREATE)) { /* Can create meetings */ }
```

### ❌ DEPRECATED AUTH PATTERNS (DO NOT USE)

```typescript
// ❌ WRONG - These are deprecated:
AuthPresets.requireAdmin        // Use requireDevAdmin or requireOpsAdmin
AuthPresets.requireLeadership   // Use specific capabilities
{ requireAdminRole: true }      // Use requireCapability
{ requireLeadershipRole: true } // Use requireCapability
{ requireStaffRole: true }      // Use requireCapability

// ❌ NEVER check by role title or name:
role.title === 'Administrator'  // WRONG! Use role.key === RoleKey.OPS_ADMIN
role.title === 'Principal'      // WRONG! Use role.key === RoleKey.ROLE_3
role.name === 'Teacher'         // WRONG! Use role.key === RoleKey.ROLE_8
user.isAdmin                    // WRONG! Use isOpsAdmin(user) or isDevAdmin(user)

// ❌ NEVER hardcode role names in logic
if (role === 'Teacher') { }     // WRONG! Use role.key === RoleKey.ROLE_8
if (role === 'Principal') { }   // WRONG! Use role.key === RoleKey.ROLE_3

// ❌ NEVER use old education-specific keys
RoleKey.PRINCIPAL               // WRONG! Use RoleKey.ROLE_3
RoleKey.TEACHER                 // WRONG! Use RoleKey.ROLE_8
RoleKey.CHIEF_EDU_OFFICER      // WRONG! Use RoleKey.ROLE_1
```

## 🏗️ PROJECT STRUCTURE

### Directory Layout
```
agendaiq/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard pages (protected)
│   │   └── auth/               # Auth pages (public)
│   ├── components/             # React components
│   ├── lib/
│   │   ├── auth/              # Auth system (policy.ts, auth-utils.ts)
│   │   ├── db/                # Database utilities
│   │   └── utils/             # General utilities
│   └── types/                 # TypeScript types
├── prisma/                    # Database schema
├── templates/                 # Existing templates
│   └── cursor-templates/      # Legacy templates (keep for now)
├── tools/                     # Build tools (future: Plop)
│   └── plop/                  # Scaffolding system (Phase 0)
├── snippets/                  # Code snippets (Phase 0)
└── .claude/                   # Claude AI specific
    ├── agents/                # Agent configurations
    └── MASTER_RULES.md        # THIS FILE
```

## 🛠️ DEVELOPMENT STANDARDS

### 1. Language Policy
- **ALL** code, comments, documentation: **ENGLISH ONLY**
- **NO** Turkish in codebase (UI, comments, variables)
- Git commits: English, no emojis

### 2. Data Policy
- **NEVER** use mock data
- **NEVER** use static/hardcoded data
- **ALWAYS** fetch from database or calculate real-time
- **NO** sample data arrays

### 3. Port Policy
- **ALWAYS** use port 3000
- **NEVER** change port number
- If port occupied: `lsof -ti:3000 | xargs kill -9`

### 4. Database Safety
- **NEVER** run `prisma migrate reset`
- **NEVER** drop tables or truncate
- **ALWAYS** backup before schema changes
- **PROTECT** Supabase production (read-only)

### 5. Git & Version Control
- **NO** `--no-verify` on commits/pushes
- **ALWAYS** fix all errors before committing
- Feature branches only, no direct main commits
- Detailed commit messages, no emojis

### 6. Error Handling
- **FIX** all TypeScript errors (must be 0)
- **FIX** all ESLint errors (must be 0)
- **NO** bypassing pre-commit/pre-push hooks
- **NO** partial fixes

## 📝 TEMPLATE SYSTEM

### Current State
- **ACTIVE**: `templates/cursor-templates/` - Use for now
- **PLANNED**: `tools/plop/` - Phase 0 implementation pending

### When Creating New Files

#### Server Component (Dashboard Page)
```typescript
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description'
};

export default async function PageName() {
  const user = await requireAuth(AuthPresets.requireStaff);
  
  return (
    <div className="space-y-6">
      {/* Content */}
    </div>
  );
}
```

#### API Route
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { z } from 'zod';

const inputSchema = z.object({
  // Define schema
});

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireCapability: Capability.USER_MANAGE
  });
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;
  
  try {
    const body = await request.json();
    const validated = inputSchema.parse(body);
    
    // Implementation
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## 🚨 CRITICAL REMINDERS

1. **READ THIS FILE FIRST** before any operation
2. **USE CAPABILITY SYSTEM** not role titles
3. **NO MOCK DATA** ever
4. **PORT 3000** always
5. **ENGLISH ONLY** everywhere
6. **FIX ALL ERRORS** before commit
7. **NO --no-verify** flags

## 📊 QUICK REFERENCE

### Check User Permissions
```typescript
// Is user a dev admin?
if (user.staff?.role?.key === RoleKey.DEV_ADMIN) { }

// Is user an ops admin?
if (user.staff?.role?.key === RoleKey.OPS_ADMIN) { }

// Can user create meetings?
if (can(user, Capability.MEETING_CREATE)) { }

// Is user any kind of admin?
if (isDevAdmin(user) || isOpsAdmin(user)) { }
```

### Common AuthPresets
- `AuthPresets.requireAuth` - Any authenticated user
- `AuthPresets.requireStaff` - Staff member required
- `AuthPresets.requireDevAdmin` - Developer admin only
- `AuthPresets.requireOpsAdmin` - Operations admin only
- `AuthPresets.requireMonitoring` - Monitoring access
- `AuthPresets.requireUserManagement` - User management access

### Common Capabilities
- `Capability.DEV_DEBUG` - Development/debugging
- `Capability.OPS_MONITORING` - System monitoring
- `Capability.USER_MANAGE` - User management
- `Capability.MEETING_CREATE` - Create meetings
- `Capability.STAFF_IMPORT` - Import staff data

## 🚀 V2 ROADMAP (Future)

### Generic Organization Support
When the application is ready for production V2, these changes are planned:

1. **Database Schema Evolution**:
   - `district` table → `organization` table
   - `school` table → `division` table  
   - Add `org_type` field to organization table
   - Keep all RoleKey values unchanged

2. **Dynamic Role Display**:
   - Each organization type can map RoleKeys to their own display names
   - Example: RoleKey.TEACHER → "Teacher" (education) or "Employee" (corporate)
   - UI will use organization context for labels

3. **Hierarchy Remains Priority-Based**:
   - Role.priority field (1-10) determines access level
   - RoleKey provides system-level identification
   - Display names are just UI labels

**IMPORTANT**: Until V2, continue using current structure (district/school) and RoleKey system

---

**Remember**: When in doubt, check this file. It's the single source of truth for AgendaIQ development.
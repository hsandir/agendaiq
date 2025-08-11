# AgendaIQ Plop + Snippet System Transition Agent

## Title: AgendaIQ Scaffolding & Snippet Transition Agent (Incremental, Zero Disruption)

### Role & Goal
Introduce a non-invasive Plop.js scaffolding + snippet system for AgendaIQ Next.js codebase. Maintain existing templates/cursor-templates/ while adding tools/plop/ and snippets/. Achieve Phase 0→3 rollout with minimal diffs, respecting all AgendaIQ-specific rules.

### Authority & Boundaries (STRICT)
- **READ `.claude/MASTER_RULES.md` FIRST** - Single source of truth for auth system
- NEVER move/rename existing files or restructure app/, lib/, components/
- PRESERVE templates/cursor-templates/ - these continue to work in parallel
- FOLLOW current auth system: Capability-based with RoleKey enum (see MASTER_RULES.md)
- NO architecture/styling rewrites; smallest necessary diffs only
- NEVER touch .env, secrets, or Supabase production database
- NEVER use mock data or static data - always real-time data
- If task affects >50 files or implies restructuring, STOP and request approval
- FOLLOW Husky gates: NEVER use --no-verify
- Port MUST be 3000 - kill existing process if needed
- NO emojis in commit messages
- English only for all code, comments, and documentation

### AgendaIQ-Specific Requirements
- ALL templates MUST include requireAuth() patterns from lib/auth/auth-utils
- Use current AuthPresets (see MASTER_RULES.md):
  - AuthPresets.requireAuth - Basic auth
  - AuthPresets.requireStaff - Staff required
  - AuthPresets.requireDevAdmin - Dev admin only
  - AuthPresets.requireOpsAdmin - Ops admin only
- API routes MUST use Capability system:
  - withAuth(request, { requireCapability: Capability.USER_MANAGE })
  - NOT requireAdminRole, requireStaffRole, etc (deprecated)
- Check roles by RoleKey enum (Role.key field):
  - user.staff?.role?.key === RoleKey.DEV_ADMIN
  - user.staff?.role?.key === RoleKey.OPS_ADMIN
  - NOT role.title === 'Administrator' (wrong)
- MUST include AuditLogger patterns for data changes
- NO Turkish in code/comments (English only)
- Database operations MUST use proper Prisma includes (Staff→Role→Department→School→District)
- NEVER hardcode statistics, numbers, or sample data
- ALWAYS fetch all data from database or calculate in real-time

### Operating Procedure (step-wise)

#### 1. Assess & Plan (read-only)
- Check existing templates/cursor-templates/ content
- Verify no Plop conflicts
- Map AgendaIQ auth patterns (requireAuth, AuthPresets, withAuth)
- Output Phase 0→3 plan with AgendaIQ adaptations

#### 2. Phase 0 — Prepare (zero behavior change)
```
tools/
├── plop/
│   ├── plopfile.js
│   ├── templates/
│   │   ├── app-route-auth/     # WITH requireAuth
│   │   ├── api-route-protected/ # WITH withAuth + rate limit
│   │   ├── component-server/
│   │   ├── component-client/
│   │   └── meeting-feature/    # AgendaIQ-specific
│   └── README.md
snippets/
├── auth-patterns/
│   ├── requireAuth.ts
│   ├── withAuth.ts
│   └── roleCheck.ts
├── database-safety/
│   ├── prismaIncludes.ts
│   └── auditLog.ts
└── type-safety/
    └── meetingTypes.ts
```
- Update .github/pull_request_template.md
- Validate: npm run build && npm run type-check

#### 3. Phase 1 — Pilot (AgendaIQ focus)
**Templates:**
- app-route-auth: Dashboard page with requireAuth(AuthPresets.requireStaff)
- api-route-protected: CRUD with withAuth, Zod validation, audit logging

**Core Snippets:**
- authCheck: Standard auth verification pattern
- prismaInclude: Full relation loading pattern
- auditLog: Change tracking pattern
- meetingResult<T,E>: Type-safe API responses
- rateLimitCheck: API rate limiting

Test on: New monitoring feature or system page

#### 4. Phase 2 — Expand (full AgendaIQ coverage)
**Additional Templates:**
- meeting-component: Meeting-specific UI patterns
- staff-management: User/Staff CRUD patterns
- test-template: Jest + Testing Library patterns

**Snippet Growth (15-20 total):**
- Role hierarchy checks
- Meeting status workflows
- Date formatting (Turkish-aware but English output)
- Error boundaries with Sentry
- CSV import/export patterns

#### 5. Phase 3 — Steady State
- Default: npm run plop for ALL new features
- Snippet Bank for small patterns (<30 lines)
- templates/cursor-templates/ remains for legacy/special cases
- Gradual migration only when touching old files

### Reporting Format
```
Phase [N] Complete:
✅ Changed: [what files/folders added]
📊 Metrics: [routes via Plop, time saved, PR comments]
⚠️ Risks: [any issues or conflicts]
↩️ Rollback: git revert [commit] or rm -rf tools/plop snippets/
🎯 Next: [next phase goals]
```

### Stop & Ask Conditions
- ANY database migration needed
- Changes to auth system core (lib/auth/*)
- >50 files touched
- Conflicts with CLAUDE.md rules
- Need to modify Prisma schema

### Success Metrics (AgendaIQ-specific)
- New meeting feature < 45 seconds scaffold
- 100% new APIs have withAuth + Zod validation
- 100% data changes have audit logging
- Zero auth bypass vulnerabilities
- 60% reduction in "missing auth check" PR comments
- All templates pass: npm run lint && npm run type-check

### Integration Points
- Works WITH existing templates/cursor-templates/
- Respects Husky pre-commit/pre-push hooks
- Compatible with monitoring systems (Sentry, etc.)
- Follows AgendaIQ role hierarchy
- Maintains English-only policy

### Example Plop Commands
```bash
npm run plop dashboard-page -- --name="reports" --auth="requireOpsAdmin"
npm run plop api-route -- --name="analytics" --method="GET,POST" --capability="OPS_MONITORING"
npm run plop meeting-component -- --name="AttendeeList" --client="false"
```

### Template Examples

#### App Route Auth Template
```typescript
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '{{titleCase name}}',
  description: '{{description}}'
};

export default async function {{pascalCase name}}Page() {
  // Use current AuthPresets from MASTER_RULES.md
  const user = await requireAuth(AuthPresets.{{auth}}); // Common: requireAuth, requireStaff, requireDevAdmin, requireOpsAdmin
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{{titleCase name}}</h1>
      {/* Page content */}
    </div>
  );
}
```

#### API Route Protected Template
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { RateLimiters } from '@/lib/utils/rate-limit';

const {{camelCase name}}Schema = z.object({
  // Define your schema
});

export async function {{method}}(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await RateLimiters.api.check(request);
  if (!rateLimitResult.success) {
    return RateLimiters.api.createErrorResponse(rateLimitResult);
  }

  // Authentication (use Capability system from MASTER_RULES.md)
  const authResult = await withAuth(request, { 
    requireCapability: Capability.{{capability}} // e.g. USER_MANAGE, MEETING_CREATE, OPS_MONITORING
  });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    // Validate input
    const body = await request.json();
    const validatedData = {{camelCase name}}Schema.parse(body);
    
    // Your logic here
    
    // Audit logging
    await AuditLogger.logFromRequest(request, {
      tableName: '{{snakeCase name}}',
      operation: '{{method}}',
      userId: user.id,
      description: '{{description}}'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```
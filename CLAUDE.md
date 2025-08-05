# AgendaIQ - Claude AI Assistant Rules & Guidelines

## 🤖 Claude AI Integration Rules

This document establishes the rules and guidelines for Claude AI when working with the AgendaIQ project - a comprehensive meeting and agenda management system for Turkish educational institutions.

## 🔄 **MODEL SWITCHING STRATEGY**

**AUTOMATIC MODEL SWITCHING PROTOCOL:**
- **Claude Sonnet 4**: Default for regular coding, implementation, debugging, and maintenance tasks
- **Claude Opus**: Automatically switch when encountering:
  - Complex architectural decisions requiring creative problem-solving
  - Advanced algorithm design and optimization challenges  
  - Sophisticated system integration problems
  - Edge cases requiring deep technical analysis
  - Performance bottlenecks needing innovative solutions
  - Security architecture requiring multi-layered approach

**SWITCHING TRIGGER PHRASES:**
- "🚨 CLAUDE OPUS RECOMMENDATION NEEDED" - Switch to Opus immediately
- "Complex architectural problem" - Indicates Opus needed
- "Advanced algorithm required" - Switch for better optimization
- "Security architecture design" - Switch for comprehensive security

**RETURN CONDITIONS:**
- Task completed successfully by Opus
- Sonnet 4 can handle the remaining implementation
- User explicitly requests return to Sonnet 4

**🔗 SOURCE FILES:** This document consolidates rules from:
- `.cursorrules` - Main project development standards
- `.cursor/rules/first` - Additional development constraints  
- `.cursor/rules/first.mdc` - Extended operational guidelines

## ⚠️ **RESOLVED LANGUAGE POLICY**

**CLARIFICATION**: All code, user interface, documentation, comments, and error messages must be in **ENGLISH ONLY**.

- **User Interface**: English (corrected from mixed policy)
- **Code Comments**: English for all types
- **Console Logs**: English 
- **Documentation**: English
- **Error Messages**: English for all users
- **Commit Messages**: English with detailed descriptions (no emojis)
- **Variable Names**: English
- **Function Names**: English
- **Database Schema**: English field names

## 📋 PROJECT CONTEXT

**AgendaIQ** is a Next.js-based educational management system featuring:
- Hierarchical role-based access control
- Meeting and agenda management
- Staff and user administration
- Turkish education institution workflows
- Multi-level organizational structure (District → School → Department → Staff)

## 🎯 CLAUDE-SPECIFIC INSTRUCTIONS

### 1. **ALWAYS USE PROJECT TEMPLATES**

When Claude creates ANY new file, it MUST follow the template system:

#### Server Components (Dashboard/Settings Pages)
```typescript
// MANDATORY: Use templates/cursor-templates/server-page-template.tsx
// Replace: PAGE_NAME, PAGE_TITLE, PAGE_DESCRIPTION
// Modify: Auth preset based on requirements
```

#### Client Components (Interactive Pages)
```typescript
// MANDATORY: Use templates/cursor-templates/client-page-template.tsx
// Replace: PAGE_NAME, PAGE_TITLE, PAGE_DESCRIPTION
// Add 'use client' directive at top
```

#### API Routes (All Endpoints)
```typescript
// MANDATORY: Use templates/cursor-templates/api-route-template.ts
// Replace: MODEL_NAME, REQUIRED_FIELD
// Include proper auth checks
// Remove unused HTTP methods
```

### 2. **AUTHENTICATION SYSTEM COMPLIANCE**

Claude MUST always implement the standardized authentication system:

```typescript
// REQUIRED IMPORTS FOR ALL FILES
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { withAuth } from '@/lib/auth/api-auth';

// PAGE AUTHENTICATION PATTERNS
const user = await requireAuth(AuthPresets.requireAuth);      // Basic
const user = await requireAuth(AuthPresets.requireStaff);    // Staff only
const user = await requireAuth(AuthPresets.requireAdmin);    // Admin only
const user = await requireAuth(AuthPresets.requireLeadership); // Leadership

// API AUTHENTICATION PATTERNS
const authResult = await withAuth(request, { requireAdminRole: true });
if (!authResult.success) {
  return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
}
const user = authResult.user!;
```

### 3. **SECURITY-FIRST DEVELOPMENT**

Claude must implement security measures:

#### Rate Limiting
```typescript
// ALWAYS include rate limiting for sensitive endpoints
import { RateLimiters, getClientIdentifier } from '@/lib/utils/rate-limit';

const clientId = getClientIdentifier(request);
const rateLimitResult = await RateLimiters.auth.check(request, 5, clientId);
if (!rateLimitResult.success) {
  return RateLimiters.auth.createErrorResponse(rateLimitResult);
}
```

#### Input Validation
```typescript
// ALWAYS validate inputs with Zod
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const result = schema.safeParse(data);
if (!result.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

### 4. **ROLE HIERARCHY ENFORCEMENT**

Claude must respect the educational hierarchy:

```typescript
// ROLE PRIORITY ORDER (1 = highest authority)
1. Administrator (priority: 1, is_leadership: true)
2. Superintendent (priority: 2, is_leadership: true)
3. Principal (priority: 3, is_leadership: true)
4. Vice Principal (priority: 4, is_leadership: true)
5. Department Head (priority: 5, is_leadership: true)
6. Teacher (priority: 6, is_leadership: false)
7. Staff (priority: 7, is_leadership: false)

// PERMISSION CHECKING PATTERN
const hasPermission = user.staff?.role.is_leadership || 
                     user.staff?.role.title === 'Administrator';
```

### 5. **DATABASE INTERACTION STANDARDS**

Claude must follow Prisma patterns:

```typescript
// REQUIRED RELATIONSHIP INCLUDES
const user = await prisma.user.findUnique({
  where: { id },
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

// AUDIT LOGGING FOR CHANGES
import { AuditLogger } from '@/lib/audit/audit-logger';

await AuditLogger.logFromRequest(request, {
  tableName: 'user',
  recordId: user.id,
  operation: 'UPDATE',
  userId: currentUser.id,
  staffId: currentUser.staff?.id,
  description: 'User profile updated'
});
```

### 6. **ERROR HANDLING REQUIREMENTS**

Claude must implement comprehensive error handling:

```typescript
// API ERROR RESPONSES
return NextResponse.json({
  error: 'Descriptive error message in Turkish',
  code: 'ERROR_CODE',
  timestamp: new Date().toISOString()
}, { status: 400 });

// PAGE ERROR HANDLING
try {
  // Operation
} catch (error) {
  console.error('Context:', error);
  redirect('/dashboard?error=operation_failed');
}
```

### 7. **STYLING & UI CONSISTENCY**

Claude must use consistent styling patterns:

```typescript
// BUTTON STYLING
className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"

// CARD STYLING
className="bg-white p-6 rounded-lg shadow-sm border"

// FORM STYLING
className="space-y-4"

// INPUT STYLING
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
```

### 8. **LANGUAGE & LOCALIZATION RULES**

Claude must follow language standards:

- **User Interface**: All text in English
- **Error Messages**: English for all users
- **Code Comments**: English for all types
- **Console Logs**: English for debugging
- **Documentation**: English for all docs
- **Variable Names**: English only
- **Function Names**: English only

```typescript
// ENGLISH UI EXAMPLE
const messages = {
  success: "Operation completed successfully",
  error: "An error occurred, please try again",
  loading: "Loading...",
  save: "Save",
  cancel: "Cancel"
};
```

### 9. **FILE ORGANIZATION STANDARDS**

Claude must organize files correctly:

```
src/
├── app/
│   ├── dashboard/          # Dashboard pages (server components)
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/
│   ├── ui/                # Reusable UI components
│   ├── dashboard/         # Dashboard-specific components
│   └── auth/              # Auth-specific components
├── lib/
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database utilities
│   └── utils/             # General utilities
└── types/
    └── index.ts           # Type definitions
```

### 10. **TESTING & VALIDATION REQUIREMENTS**

Claude must include testing considerations:

```typescript
// API ENDPOINT TESTING
// Test command: curl -X POST 'http://localhost:3000/api/endpoint'

// AUTHENTICATION TESTING
// - Test unauthorized access (should redirect)
// - Test role-based access (should enforce hierarchy)
// - Test rate limiting (should block excessive requests)

// PAGE TESTING
// - Verify server component rendering
// - Check client component interactivity
// - Validate error boundaries
```

### 11. **OPERATIONAL CONSTRAINTS**

#### Port Management
- **MANDATORY**: Always use port 3000
- **NEVER** change the port number
- If port 3000 is occupied, kill the existing process first
- Before starting the app, check for all kinds of errors

#### Version Control Requirements
- **ALWAYS** use version control for changes
- Save old version via git before making changes
- Explain all changes made in commit messages
- **NO** emojis or icons in commit messages
- Use detailed descriptions instead
- Feature branches for development, regular merges to main
- Monday backups from main/release branches

#### Server Monitoring
- **ALWAYS** monitor server logs for potential issues
- Check the app for all kinds of errors before starting
- Check the app for all kinds of errors before giving results

#### Data Handling Rules
- **NEVER** use mock data or api_fallback mock
- **ALWAYS** write code that generates real-time data
- **NEVER** use static data
- **ALWAYS** pull data from original positions every time

#### File Modification Policy
- **NEVER** recreate entire files when changes are needed
- **ONLY** change necessary parts
- Preserve existing functionality when adding features

#### Authentication Verification
- **ALWAYS** verify that pages are centrally authenticated
- Use centralized authentication system for all operations
- Check authentication status on every operation

#### Centralized Styling
- **ALWAYS** use centralized CSS system
- **NEVER** create file-specific designs
- Use Tailwind CSS through centralized theme system
- Follow established design patterns

## 🚫 FORBIDDEN PATTERNS FOR CLAUDE

Claude must NEVER do the following:

❌ **Skip authentication checks**
```typescript
// WRONG - No auth check
export default function Page() {
  return <div>Content</div>;
}

// CORRECT - Always check auth
export default async function Page() {
  const user = await requireAuth(AuthPresets.requireAuth);
  return <div>Content</div>;
}
```

❌ **Use direct session access**
```typescript
// WRONG - Direct session access
const session = await getServerSession();

// CORRECT - Use auth utilities
const user = await getCurrentUser();
```

❌ **Create custom CSS files**
```typescript
// WRONG - Custom CSS
import './custom.css';

// CORRECT - Tailwind classes
className="bg-blue-600 text-white px-4 py-2"
```

❌ **Hardcode user data**
```typescript
// WRONG - Hardcoded
const isAdmin = true;

// CORRECT - Database check
const isAdmin = user.staff?.role.title === 'Administrator';
```

❌ **Use inconsistent language**
```typescript
// WRONG - Mixed languages
<button>Kaydet</button> // Turkish
const errorMsg = "Error occurred"; // English

// CORRECT - Consistent English
<button>Save</button> // English
const errorMsg = "Error occurred"; // English
```

❌ **Change port number from 3000**
```typescript
// WRONG - Different port
const server = app.listen(3001);

// CORRECT - Always use port 3000
const server = app.listen(3000);
```

❌ **Use mock or static data**
```typescript
// WRONG - Mock data
const users = [{ id: 1, name: 'Test' }];

// CORRECT - Real-time data
const users = await prisma.user.findMany();
```

❌ **Recreate entire files for small changes**
```typescript
// WRONG - Rewriting entire component for one prop
// [entire file rewritten]

// CORRECT - Only modify necessary parts
// [targeted changes only]
```

❌ **Use emojis in commit messages**
```git
# WRONG - Emojis in commits
git commit -m "✨ Add new feature"

# CORRECT - Descriptive commits
git commit -m "Add user authentication with role-based access control"
```

❌ **Skip authentication verification**
```typescript
// WRONG - No auth check
function handleAction() {
  // direct action
}

// CORRECT - Always verify auth
function handleAction() {
  if (!user.staff) throw new Error('Authentication required');
  // action
}
```

## ✅ CLAUDE SUCCESS CHECKLIST

Before completing any task, Claude must verify:

1. ✅ **Authentication**: Proper auth system implementation
2. ✅ **Authorization**: Role-based access control applied  
3. ✅ **Security**: Rate limiting and input validation included
4. ✅ **Types**: Full TypeScript type safety
5. ✅ **Styling**: Consistent Tailwind CSS usage
6. ✅ **Language**: English for all code and UI elements
7. ✅ **Database**: Proper Prisma patterns and relationships
8. ✅ **Error Handling**: Comprehensive error management
9. ✅ **Audit**: Logging for important operations
10. ✅ **Performance**: Optimized queries and pagination
11. ✅ **Port**: Uses port 3000 exclusively
12. ✅ **Data**: Real-time data, no mock/static data
13. ✅ **Version Control**: Proper git usage with detailed commits
14. ✅ **Monitoring**: Server logs checked for issues
15. ✅ **File Changes**: Only necessary parts modified

## 🔧 CLAUDE WORKFLOW

When Claude receives a task:

1. **Analyze**: Understand the requirement and security implications
2. **Template**: Choose appropriate template from templates/cursor-templates/
3. **Implement**: Code with security-first approach
4. **Validate**: Check against forbidden patterns
5. **Test**: Provide testing guidance
6. **Document**: Add relevant comments and documentation

## 📂 SESSION MANAGEMENT RULES

### Session Persistence
Claude MUST maintain session continuity across restarts:

1. **On Every Significant Action**:
   - Update `.claude/session.json` with current state
   - Log progress in `.claude/history.md`
   - Track active tasks and next steps

2. **Before Session Exit**:
   ```json
   // Update .claude/session.json
   {
     "lastUpdated": "ISO timestamp",
     "currentTask": "What was being worked on",
     "nextSteps": ["Priority 1", "Priority 2"],
     "uncommittedChanges": true/false,
     "serverRunning": true/false
   }
   ```

3. **On Session Resume**:
   - Read `.claude/session.json` automatically
   - Check git status for uncommitted work
   - Continue from last task WITHOUT asking
   - Only announce: "Resuming work on: [current task]"

4. **Session Commands**:
   - "hadi devam edelim" = Resume without questions
   - "exit" = Save state and prepare for closure
   - "status" = Show current session state

### Auto-Resume Protocol
When user says "hadi devam edelim" or similar:
1. ✅ Load session state silently
2. ✅ Announce current task briefly
3. ✅ Continue work immediately
4. ❌ Do NOT ask "what were we doing?"
5. ❌ Do NOT list all previous work
6. ❌ Do NOT wait for confirmation

## 🚨 EMERGENCY PROCEDURES

If Claude encounters authentication issues:

1. Check `src/lib/auth/auth-utils.ts` exports
2. Verify `src/lib/auth/auth-options.ts` configuration  
3. Test API middleware in `src/lib/auth/api-auth.ts`
4. Validate database connection and migrations
5. Review user role assignments in database

## 🔧 ADDITIONAL OPERATIONAL REQUIREMENTS

### Pre-Development Checklist
- [ ] Verify port 3000 is available
- [ ] Check server logs for existing issues
- [ ] Confirm database connection is active
- [ ] Validate authentication system is working

### Post-Development Checklist
- [ ] Test all authentication flows
- [ ] Verify rate limiting is working
- [ ] Check server logs for new errors
- [ ] Confirm all UI text is in English
- [ ] Validate real-time data (no mock data)
- [ ] Test on port 3000 only

### Issue Tracking Requirements
- Use GitHub issues for all bugs and features
- Link commits to issues where applicable
- Document breaking changes thoroughly
- Include reproduction steps for bugs

### Database Reset Protocol
- If database reset is required, proceed with caution
- Ensure consistency across all environments
- Backup existing data before reset
- Verify all migrations run successfully
- Test authentication system post-reset

## 📝 CLAUDE RESPONSE FORMAT

When providing code solutions, Claude should:

1. **Explain** the security considerations
2. **Show** the complete implementation  
3. **Highlight** English language consistency
4. **Indicate** testing steps
5. **Warn** about potential security risks
6. **Verify** port 3000 usage
7. **Confirm** real-time data implementation
8. **Check** centralized authentication

## 🧪 AUTOMATIC TEST GENERATION RULES

### Test Creation Requirements

When Claude creates ANY new component or API endpoint, it MUST:

1. **Automatically generate corresponding test file**
```typescript
// When creating: src/components/user-profile.tsx
// MUST also create: src/__tests__/unit/components/user-profile.test.tsx

// When creating: src/app/api/users/route.ts
// MUST also create: src/__tests__/unit/api/users.test.ts
```

2. **Use TestGenerator utility for consistent test structure**
```typescript
import { TestGenerator } from '@/lib/testing/test-generator'

// Generate test automatically
const { testPath, content } = await TestGenerator.generateTestForFile(componentPath)
```

3. **Include minimum test coverage**
- Component tests: Render, props, events, state changes
- API tests: Auth, validation, success/error cases, rate limiting
- Minimum 80% coverage for new code

4. **Follow test naming conventions**
```typescript
describe('ComponentName', () => {
  it('renders without crashing', () => {})
  it('handles user interactions', () => {})
  it('displays correct data', () => {})
})
```

5. **Test file structure**
```
src/__tests__/
├── unit/
│   ├── components/   # Component unit tests
│   ├── api/         # API endpoint tests
│   └── utils/       # Utility function tests
├── integration/     # Integration tests
└── e2e/            # End-to-end tests
```

### Test Implementation Standards

1. **Always use test utilities**
```typescript
import { renderWithProviders, mockSession } from '@/__tests__/utils/test-utils'
```

2. **Mock external dependencies**
```typescript
jest.mock('@/lib/prisma')
jest.mock('next-auth/react')
```

3. **Test security features**
```typescript
// Always test authentication
it('requires authentication', async () => {})
it('enforces role-based access', async () => {})
```

4. **Test error scenarios**
```typescript
it('handles network errors gracefully', async () => {})
it('displays user-friendly error messages', async () => {})
```

### Automated Test Generation Process

When creating new files:

1. **Component Creation Flow**
```bash
# Claude creates component
src/components/meeting-card.tsx

# Claude MUST immediately generate test
src/__tests__/unit/components/meeting-card.test.tsx
```

2. **API Endpoint Creation Flow**
```bash
# Claude creates API route
src/app/api/meetings/stats/route.ts

# Claude MUST immediately generate test
src/__tests__/unit/api/meetings-stats.test.ts
```

3. **Update Test Dashboard**
- New tests automatically appear in test dashboard
- Coverage metrics update in real-time
- Failed tests trigger notifications

### Test Quality Checklist

Before completing any task, Claude must verify:

1. ✅ **Test File Created**: Corresponding test exists
2. ✅ **Test Passes**: All tests are green
3. ✅ **Coverage Met**: Minimum 80% coverage
4. ✅ **Edge Cases**: Error states tested
5. ✅ **Security Tested**: Auth and permissions verified
6. ✅ **Accessibility**: ARIA attributes tested

## 🎯 SUCCESS METRICS

Claude's success is measured by:

- **Security**: Zero security vulnerabilities introduced
- **Consistency**: Follows all established patterns
- **Functionality**: Code works as intended
- **Maintainability**: Easy to understand and modify
- **Performance**: Optimized for production use
- **Test Coverage**: Minimum 80% coverage for all new code
- **Test Quality**: Comprehensive test scenarios

---

**Remember**: AgendaIQ is a production system for Turkish educational institutions. Security, reliability, and user experience are paramount. Always err on the side of caution and security.

*Follow these rules religiously. Any deviation must be explicitly justified and documented.*
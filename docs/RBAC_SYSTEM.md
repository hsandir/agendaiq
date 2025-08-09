# AgendaIQ RBAC (Role-Based Access Control) System

## Overview

AgendaIQ implements a capability-based RBAC system with two distinct admin types:

- **DEV_ADMIN** (System Developer): Full system access including development tools
- **OPS_ADMIN** (School Administrator): School operations and management, NO development access

This system completely replaces the old string-based role checking with a centralized policy system.

## Architecture

### Core Components

1. **`src/lib/auth/policy.ts`** - Single source of truth for all authorization
2. **`src/lib/auth/auth-utils.ts`** - Authentication utilities with capability support
3. **`src/middleware.ts`** - Route-level access control
4. **Database Schema** - Role keys and permission capabilities

### Role Hierarchy

```
DEV_ADMIN (System Developer)
├── All development capabilities (dev:*)
├── All operations capabilities (ops:*)
└── All management capabilities

OPS_ADMIN (School Administrator)
├── Operations capabilities (ops:*)
├── Management capabilities  
└── NO development access (dev:* blocked)

Other Roles (TEACHER, STAFF, etc.)
└── Limited capabilities based on role
```

## Database Schema

### New Tables

#### Permission Table
```sql
CREATE TABLE Permission (
  id           SERIAL PRIMARY KEY,
  role_id      INTEGER NOT NULL REFERENCES Role(id),
  capability   TEXT NOT NULL,  -- e.g., "dev:ci", "ops:monitoring"
  resource     TEXT,           -- e.g., "dashboard", "api"
  action       TEXT,           -- e.g., "read", "write"
  conditions   JSONB,          -- Additional conditions
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
```

### Updated Tables

#### Role Table
```sql
ALTER TABLE Role ADD COLUMN key TEXT UNIQUE; -- 'DEV_ADMIN', 'OPS_ADMIN', etc.
```

#### User Table
```sql
ALTER TABLE User ADD COLUMN is_system_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN is_school_admin BOOLEAN DEFAULT FALSE;
```

## Capabilities

### Development Capabilities (DEV_ADMIN only)
- `dev:ci` - CI/CD operations
- `dev:git` - Git operations
- `dev:seed` - Database seeding
- `dev:lint` - Code linting
- `dev:debug` - Debug tools
- `dev:update` - System updates
- `dev:fix` - Error fixing
- `dev:mockdata` - Mock data management

### Operations Capabilities (OPS_ADMIN + DEV_ADMIN)
- `ops:monitoring` - System monitoring
- `ops:alerts` - Alert management
- `ops:backup` - Backup management
- `ops:logs` - Log access
- `ops:health` - Health checks
- `ops:db:read` - Database read access

### Management Capabilities (OPS_ADMIN + DEV_ADMIN)
- `user:manage` - User management
- `role:manage` - Role management
- `perm:manage` - Permission management
- `school:manage` - School management
- `staff:import` - Staff import

### Meeting Capabilities (Role-based)
- `meeting:create` - Create meetings
- `meeting:view` - View meetings
- `meeting:edit` - Edit meetings
- `meeting:edit:own` - Edit own meetings only
- `meeting:delete` - Delete meetings

## Route Access Control

### Development-Only Routes (DEV_ADMIN)
```
/dashboard/development
/dashboard/tests  
/dashboard/design-system-demo
/dashboard/theme-debug
/dashboard/system/dependencies
/dashboard/system/lint
/dashboard/system/migration
/dashboard/system/updates
```

### Operations Routes (OPS_ADMIN + DEV_ADMIN)
```
/dashboard/monitoring
/dashboard/system/alerts
/dashboard/system/backup
/dashboard/system/health
/dashboard/system/logs
/dashboard/settings/users
/dashboard/settings/roles
```

### API Access Control

#### Development APIs (DEV_ADMIN only)
```
/api/dev/**
/api/debug/**
/api/tests/**
/api/system/lint
/api/system/fix
/api/system/update
```

#### Operations APIs (OPS_ADMIN + DEV_ADMIN)
```
/api/monitoring/**
/api/system/alerts
/api/system/backup
/api/admin/**
/api/users/**
```

## Usage Examples

### Page Protection
```typescript
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';

// Development page
export default async function DevelopmentPage() {
  const user = await requireAuth(AuthPresets.requireDevelopment);
  return <div>Dev tools</div>;
}

// Operations page  
export default async function MonitoringPage() {
  const user = await requireAuth(AuthPresets.requireMonitoring);
  return <div>Monitoring</div>;
}
```

### API Protection
```typescript
import { withAuth } from '@/lib/auth/api-auth';
import { can, Capability } from '@/lib/auth/policy';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  
  const user = authResult.user!;
  
  // Check specific capability
  if (!can(user, Capability.DEV_DEBUG)) {
    return NextResponse.json({ error: 'Development access required' }, { status: 403 });
  }
  
  // Proceed with API logic
}
```

### UI Conditional Rendering
```typescript
import { can, Capability, isDevAdmin } from '@/lib/auth/policy';

function DashboardMenu({ user }: { user: UserWithCapabilities }) {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      {can(user, Capability.MEETING_CREATE) && (
        <Link href="/dashboard/meetings">Meetings</Link>
      )}
      {can(user, Capability.OPS_MONITORING) && (
        <Link href="/dashboard/monitoring">Monitoring</Link>
      )}
      {isDevAdmin(user) && (
        <Link href="/dashboard/development">Development</Link>
      )}
    </nav>
  );
}
```

## Admin Users

### Current Admin Setup
- **admin@school.edu** - OPS_ADMIN (School Administrator)
- **dev@agendaiq.com** - DEV_ADMIN (System Developer) 
- **sysadmin@cjcollegeprep.org** - OPS_ADMIN (School Administrator)

### Password for dev@agendaiq.com
Default password: `dev1234`

## Migration Notes

### What Changed
1. ✅ Added `key` field to Role table
2. ✅ Added Permission table for capabilities
3. ✅ Added admin flags to User table
4. ✅ Migrated all existing roles to use keys
5. ✅ Created permissions for DEV_ADMIN and OPS_ADMIN
6. ✅ Updated auth system to use capabilities
7. ✅ Updated middleware for capability-based routing

### Backward Compatibility
- Legacy `requireAdmin` and `requireLeadership` still work
- Old role title checks still work alongside new system
- Gradual migration path allows testing without breaking existing functionality

## Security Features

### Separation of Concerns
- School administrators CANNOT access development tools
- System developers have full access for maintenance
- Clear audit trail for all capability usage

### Principle of Least Privilege
- Users only get capabilities they need for their role
- Granular permissions prevent over-privileging
- Context-aware permissions (e.g., edit own vs edit all)

## Testing

### Test User Access
```bash
# Test OPS_ADMIN access (admin@school.edu / 1234)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/monitoring
# Should: ✅ Success

curl -H "Authorization: Bearer <token>" http://localhost:3000/api/dev/seed
# Should: ❌ 403 Forbidden

# Test DEV_ADMIN access (dev@agendaiq.com / dev1234)  
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/dev/seed
# Should: ✅ Success
```

### Page Access Testing
1. Login as admin@school.edu
   - ✅ Can access /dashboard/monitoring
   - ❌ Cannot access /dashboard/development
   
2. Login as dev@agendaiq.com
   - ✅ Can access /dashboard/development
   - ✅ Can access /dashboard/monitoring

## Troubleshooting

### Common Issues

#### "Insufficient permissions" error
- Check user's role key in database
- Verify permissions exist for the role
- Check capability spelling in route policy

#### Development pages not accessible
- Ensure user has DEV_ADMIN role or is_system_admin = true
- Check middleware is using new capability system

#### Old admin checks not working
- Legacy `requireAdminRole` should still work
- Check auth-utils has backward compatibility

### Debug Commands
```bash
# Check user's capabilities
node -e "
const { getUserCapabilities } = require('./src/lib/auth/policy');
getUserCapabilities(userId).then(console.log);
"

# Check role permissions
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.role.findFirst({
  where: { key: 'OPS_ADMIN' },
  include: { Permissions: true }
}).then(console.log);
"
```

## Future Enhancements

### Planned Features
1. **Field-Level Permissions** - Control access to specific data fields
2. **Time-Based Permissions** - Temporary access grants
3. **Context-Aware Permissions** - Location or device-based access
4. **Permission Inheritance** - Role hierarchy with capability inheritance
5. **Audit Dashboard** - Visual permission usage tracking

### Adding New Capabilities
1. Add capability to `Capability` enum in policy.ts
2. Add route mapping to `RoutePolicy` or `ApiRoutePolicy`
3. Create permissions in database for relevant roles
4. Test access control

## References

- [RBAC Wikipedia](https://en.wikipedia.org/wiki/Role-based_access_control)
- [NIST RBAC Standard](https://csrc.nist.gov/projects/role-based-access-control)
- [Principle of Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
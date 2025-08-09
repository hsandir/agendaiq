# Security Testing Policy for AgendaIQ

## Executive Summary
This document establishes the comprehensive testing policy for AgendaIQ's capability-based authentication and authorization system. It defines objectives, scope, test strategies, and acceptance criteria for validating the security infrastructure.

## Compliance Status with Current Implementation

### ✅ COMPLIANT AREAS

1. **Capability-Based RBAC** 
   - Policy system fully implemented in `/src/lib/auth/policy.ts`
   - JWT enrichment with capabilities working in `auth-options.ts`
   - Middleware enforcement via `canAccessRoute()` and `canAccessApi()`

2. **Middleware Security Chain**
   - Rate limiting returns `null` to continue chain (FIXED)
   - Audit middleware returns `null` to preserve headers (FIXED)
   - Security headers applied at end of chain
   - Public endpoints properly restricted

3. **Admin Separation**
   - DEV_ADMIN and OPS_ADMIN properly separated
   - Legacy "Administrator" title checks removed
   - Capability-based authorization in all admin APIs

4. **2FA Implementation**
   - Setup, verify, disable flows implemented
   - Backup codes generation and single-use validation
   - TOTP integration with speakeasy

### ⚠️ AREAS NEEDING ATTENTION

1. **Google OAuth**
   - Currently disabled (commented out)
   - Needs PrismaAdapter implementation
   - Decision pending on inclusion

2. **Test Coverage**
   - No automated tests currently exist
   - Need to implement Jest, Playwright, and integration tests
   - Coverage reporting not configured

3. **Field-Level ACL**
   - Basic implementation exists but not fully tested
   - Needs comprehensive validation

4. **Observability**
   - Audit logging implemented but needs test validation
   - Sentry context setting needs verification

## Testing Policy

### 1. OBJECTIVES
- Validate end-to-end capability-based authentication and authorization
- Detect regressions and legacy patterns bypassing policy
- Ensure public vs protected routes consistency
- Establish reusable test data and CI strategy

### 2. SCOPE

#### In Scope
- **Core Auth**: NextAuth config, credentials login, JWT/session callbacks, RBAC policy, middleware chain
- **APIs**: Admin, roles, users, meetings, monitoring, dev/debug endpoints
- **UI**: Sign-in/register/2FA forms, protected pages, capability-driven visibility
- **Security**: Headers, rate limiting, privilege escalation prevention
- **Observability**: Audit logs, Sentry integration

#### Out of Scope
- Non-auth business logic beyond access control
- Performance optimization (except basic smoke tests)
- Third-party service integrations (except Pusher auth)

### 3. TEST LEVELS

#### Unit Tests (Priority: P0)
```javascript
// Test pure functions without I/O
- Policy functions (can, canAccessRoute, canAccessApi)
- Capability checks
- Token transformations
- Helper utilities
```

#### Integration Tests (Priority: P0)
```javascript
// Test component interactions
- API route handlers with auth
- Prisma database operations
- NextAuth callbacks
- Middleware behavior
```

#### E2E Tests (Priority: P1)
```javascript
// Test complete user flows
- Login/logout flows
- 2FA setup and verification
- Protected page access
- Role-based UI visibility
```

#### Security Tests (Priority: P0)
```javascript
// Test security controls
- Rate limiting enforcement
- Security headers presence
- Token tampering prevention
- Privilege escalation attempts
```

### 4. TEST ENVIRONMENTS

#### Local Test Environment
```bash
# .env.test configuration
NODE_ENV=test
DATABASE_URL=sqlite://test.db  # Or ephemeral Postgres
NEXTAUTH_SECRET=test-secret-32-chars-minimum
NEXTAUTH_URL=http://localhost:3000
```

#### CI Environment
- GitHub Actions workflow
- Isolated test database
- Headless browser for E2E
- No real secrets

### 5. TEST DATA STRATEGY

#### Baseline Seed Data
```typescript
// Users
- systemAdmin: DEV_ADMIN role, all capabilities
- schoolAdmin: OPS_ADMIN role, no dev:* capabilities  
- teacher: Teacher role, limited capabilities
- student: No staff, minimal capabilities

// Roles & Permissions
- DEV_ADMIN: Full system access
- OPS_ADMIN: School management
- Teacher: Classroom management
- Department Chair: Department oversight

// Entities
- 1 District, 2 Schools, 3 Departments
- 5 Meetings (various ownership)
- 2FA enabled/disabled users
```

### 6. TEST MATRIX

#### Authentication Tests
| Test Case | Priority | Status |
|-----------|----------|--------|
| Valid credentials login | P0 | 🔴 Not Implemented |
| Invalid password rejection | P0 | 🔴 Not Implemented |
| Missing fields validation | P0 | 🔴 Not Implemented |
| Rate limiting on auth | P0 | 🔴 Not Implemented |
| 2FA flow complete | P0 | 🔴 Not Implemented |
| JWT enrichment validation | P0 | 🔴 Not Implemented |

#### Authorization Tests
| Test Case | Priority | Status |
|-----------|----------|--------|
| System admin full access | P0 | 🔴 Not Implemented |
| School admin no dev access | P0 | 🔴 Not Implemented |
| Capability enforcement | P0 | 🔴 Not Implemented |
| Meeting ownership checks | P1 | 🔴 Not Implemented |
| API route protection | P0 | 🔴 Not Implemented |
| UI capability gating | P1 | 🔴 Not Implemented |

#### Security Tests
| Test Case | Priority | Status |
|-----------|----------|--------|
| Rate limit not bypassed | P0 | ✅ Fixed in Code |
| Security headers present | P0 | ✅ Fixed in Code |
| Token tampering prevention | P0 | 🔴 Not Tested |
| Public endpoint restrictions | P0 | ✅ Implemented |
| CSRF protection | P1 | 🔴 Not Tested |

### 7. NEGATIVE TEST CASES

#### Abuse Scenarios
1. **Token Tampering**: Manually craft JWT with elevated privileges
2. **Capability Drift**: Remove permissions after session creation
3. **Rate Limit Evasion**: Rotate identifiers to bypass limits
4. **Public Endpoint Abuse**: Attempt privileged ops on public routes
5. **Session Hijacking**: Reuse expired/revoked tokens
6. **Privilege Escalation**: Modify user role mid-session

### 8. COVERAGE GOALS

| Module | Statement | Branch | Functions |
|--------|-----------|--------|-----------|
| Core Auth (policy, middleware) | 85% | 80% | 85% |
| API Routes (admin, system) | 70% | 65% | 70% |
| UI Components (auth-related) | 60% | 55% | 60% |
| E2E Critical Paths | N/A | N/A | 100% |

### 9. CI/CD INTEGRATION

#### Pipeline Stages
```yaml
1. Unit Tests (5 min)
   - Run Jest unit tests
   - Generate coverage report
   
2. Integration Tests (10 min)
   - Seed test database
   - Run API integration tests
   - Validate middleware chain

3. E2E Smoke Tests (5 min)
   - Critical path validation
   - Login, 2FA, admin access

4. Full E2E Suite (20 min)
   - Complete user journeys
   - Cross-browser testing
   - Accessibility validation
```

### 10. REPORTING & METRICS

#### Required Reports
- JUnit XML for CI integration
- HTML coverage reports
- Playwright trace viewer reports
- Security scan results
- Performance baseline metrics

#### Key Metrics
- Test coverage percentage
- Test execution time
- Flaky test rate
- Security vulnerability count
- Failed auth attempt patterns

### 11. ENTRY/EXIT CRITERIA

#### Entry Criteria
- [ ] Test database configured
- [ ] `.env.test` populated
- [ ] Seed scripts ready
- [ ] Build passing

#### Exit Criteria
- [ ] Core auth tests passing (100%)
- [ ] Coverage thresholds met
- [ ] No P0 security issues
- [ ] Performance within SLA
- [ ] Documentation complete

### 12. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google OAuth not ready | Medium | Test with/without adapter paths |
| Test data inconsistency | High | Deterministic seeding |
| Flaky E2E tests | Medium | Retry logic, stable selectors |
| Coverage gaps | High | Mutation testing supplement |
| CI resource limits | Low | Parallel execution, caching |

### 13. IMPLEMENTATION ROADMAP

#### Phase 1: Foundation (Week 1)
- [ ] Setup Jest and testing libraries
- [ ] Create test database configuration
- [ ] Implement seed data scripts
- [ ] Write unit tests for policy functions

#### Phase 2: Integration (Week 2)
- [ ] API route integration tests
- [ ] Middleware chain validation
- [ ] 2FA flow testing
- [ ] Database transaction tests

#### Phase 3: E2E & Security (Week 3)
- [ ] Playwright setup
- [ ] Critical user journeys
- [ ] Security abuse scenarios
- [ ] Performance baselines

#### Phase 4: CI/CD (Week 4)
- [ ] GitHub Actions workflow
- [ ] Coverage reporting
- [ ] Automated security scans
- [ ] Documentation and training

## Compliance Checklist

### Immediate Actions Required
1. **Create test infrastructure**
   ```bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom
   npm install --save-dev @playwright/test
   npm install --save-dev supertest msw
   ```

2. **Configure test database**
   ```typescript
   // prisma/schema.test.prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./test.db"
   }
   ```

3. **Implement seed scripts**
   ```typescript
   // scripts/seed-test.ts
   async function seedTestData() {
     // Create roles, users, permissions
   }
   ```

4. **Write critical path tests**
   - Authentication flow
   - Authorization checks
   - Security headers
   - Rate limiting

### Non-Compliant Items Requiring Decisions

1. **Google OAuth Implementation**
   - Decision: Include or exclude?
   - If include: Add PrismaAdapter
   - If exclude: Remove provider completely

2. **Field-Level ACL**
   - Current implementation partial
   - Decision: Full implementation or defer?

3. **Performance Testing**
   - Not currently specified
   - Decision: Include basic benchmarks?

4. **Mutation Testing**
   - Advanced technique
   - Decision: Phase 2 or defer?

## Conclusion

The current implementation is architecturally sound and follows security best practices. The primary gap is the absence of automated testing. This policy provides a comprehensive framework for implementing a robust test suite that will validate and maintain the security posture of the AgendaIQ platform.

### Priority Recommendations
1. **P0**: Implement unit tests for core auth functions
2. **P0**: Add integration tests for critical APIs
3. **P1**: Setup E2E tests for login and 2FA
4. **P1**: Configure CI/CD pipeline
5. **P2**: Add performance and security scanning

---
Policy Version: 1.0.0
Last Updated: 2025-08-09
Review Schedule: Monthly
Owner: Security Team
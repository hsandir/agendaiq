# Auth & RBAC Test Plan

## Objectives
- Validate capability-based auth end-to-end: authentication, authorization, JWT/session enrichment, middleware enforcement, rate limiting, auditing, and 2FA.
- Detect regressions and legacy code paths (role-title checks, session-only checks) that bypass policy.
- Ensure public vs protected routes comply with `ApiRoutePolicy` and middleware.

## Scope
- Core: NextAuth config, credentials login, Google OAuth (decision-dependent), JWT/session callbacks, RBAC policy, middleware (auth, rate-limit, audit), 2FA.
- APIs: admin, users, roles, staff, schools/departments, meetings/templates, system/monitoring, dev/debug/tests, internal.
- UI: sign-in/register/2FA forms, protected pages, redirects, capability-driven UI visibility.
- Observability: audit logs and Sentry context.
- Security: header hardening, rate-limit enforcement, privilege escalation attempts.

## Environments
- `.env.test` with dummy secrets; disposable DB (sqlite or ephemeral Postgres).
- CI mirrors local test; seeded DB; headless browser for E2E.

## Tooling
- Unit/Integration: Jest, TL React, Supertest, MSW, Next request/response mocks.
- E2E: Playwright (login, redirects, 2FA, protected pages).
- DB: Prisma test client; per-suite seed/reset.
- Coverage: Jest coverage with per-module thresholds.

## Test Data & Seeding
- Users: system admin (all caps), school admin (no dev:*), staff user (limited), non-staff user, first user.
- Roles/Permissions: Capability records; role hierarchy where needed.
- Entities: School, District, Department; meetings (own vs others).
- 2FA: One enabled with backup codes, one disabled.
- OAuth (if enabled): one known and one unknown Google user.

## Test Levels & Thresholds
- Unit: pure functions/policies/helpers.
- Integration: handlers + middleware + Prisma + NextAuth.
- E2E: primary flows.
- Coverage goals: auth core modules (policy, middleware, auth-options) ≥ 80% branches, ≥ 85% statements.

## Test Matrix (IDs)

### Policy (Unit)
- AUTH-POL-01: `can` → system admin grants all.
- AUTH-POL-02: `can` → school admin denies dev:*, allows ops:* / manage / view / meeting:*
- AUTH-POL-03: `can` → MEETING_EDIT_OWN context owner check.
- AUTH-POL-04: `canAccessRoute` → mapped routes require caps; others default allow (confirm intentionality).
- AUTH-POL-05: `canAccessApi` → public APIs allowed; mapped APIs enforce caps; unmapped require auth.
- AUTH-POL-06: `getUserCapabilities` → sysadmin all, school admin filtered, role-permission mapped.

### Rate Limit (Unit)
- AUTH-RL-01: under limit → success + headers computed.
- AUTH-RL-02: over limit → 429 + Retry-After.

### Middleware (Integration)
- AUTH-MWINT-01: Rate-limited path under quota still enforces auth/policy (no bypass) [Known-Issue until fix].
- AUTH-MWINT-02: Over quota returns 429 with headers.
- AUTH-MWINT-03: Audit does not suppress security headers; headers present on 2xx/4xx [Known-Issue until fix].
- AUTH-MWINT-04: Public endpoints (auth/health/setup/check) accessible; sensitive endpoints blocked.

### NextAuth (Integration)
- AUTH-INT-01: Valid credentials login; session/jwt enriched (caps, flags, staff summary).
- AUTH-INT-02: Wrong password → 401; rate limiter increments.
- AUTH-INT-03: 2FA enabled: missing code → 2FA_REQUIRED; wrong code → 400; correct TOTP → success.
- AUTH-INT-04: Backup codes: success once; code removed from DB.
- AUTH-INT-05: Auth rate limit: 6th attempt within 15 min → 429.

### Registration / Forgot Password (Integration)
- AUTH-INT-06: Signup valid; first-user admin staff assignment (if applicable).
- AUTH-INT-07: Signup duplicate email → 409; rate limit enforced.
- AUTH-INT-08: Forgot password avoids enumeration (always 200 message); validation errors 400.

### Admin/Policy-Protected APIs (Integration)
- AUTH-INT-11: `/api/admin/**`: ops/dev admin 2xx; normal user 403; anon 401.
- AUTH-INT-12: `/api/system/**` & `/api/dev/**` & `/api/internal/**`: correct capability gating per endpoint.
- AUTH-INT-13: `/api/meetings/**` & `/api/meeting-templates/**`: auth required; capability dictates view/create/edit; own-edit respected.

### Pusher Auth (Integration)
- AUTH-INT-14: Organizer/attendee/admin allowed; unrelated user 403; malformed channel 400.
- AUTH-INT-15: Presence channel user_info contains expected fields.

### Field-Level ACL (Integration, if enabled)
- AUTH-INT-16: `withFieldAccess` filters response fields and validates writes when `request.user` is attached.

### Audit/Observability (Integration)
- AUTH-INT-17: Critical paths generate audit events; internal processing succeeds.
- AUTH-INT-18: `AuthProvider` sets/clears Sentry user context on login/logout.

### OAuth (Integration, decision-dependent)
- AUTH-INT-21: Domain allowlist allowed/denied.
- AUTH-INT-22: Existing credentials user + Google → secure linking; no takeover.
- AUTH-INT-23: New Google user pending/approval flow; enrichment after approval.
- AUTH-INT-24: 2FA required for high-priv OAuth users (if policy enabled).

## E2E (Playwright)
- AUTH-E2E-01: Login → dashboard redirect → protected page accessible.
- AUTH-E2E-02: Wrong password error; lockout messaging respects rate-limit.
- AUTH-E2E-03: 2FA setup/verify; login requires TOTP; backup code single use; disable 2FA.
- AUTH-E2E-04: Anonymous to `/dashboard/*` redirects to `/auth/signin?callbackUrl=...`.
- AUTH-E2E-05: Capability-based UI visibility (system/monitoring/admin menus).
- AUTH-E2E-06: `/api/test-sentry` behavior per chosen policy (dev-public vs capability).

## CI & Reporting
- Pipeline: Unit → Integration(API) → E2E(smoke) → Full E2E nightly.
- Artifacts: JUnit, HTML reports, coverage summary; flaky retries.
- Thresholds: Auth core modules ≥ 80/85; API handlers ≥ 70 statements; E2E smoke must pass.

## Known-Issue Tests
- AUTH-MWINT-01, AUTH-MWINT-03 expected red until middleware fixes land.

## Exit Criteria
- P0/P1 suites green; known-issues resolved.
- Coverage thresholds met; audit logs verified on critical paths.


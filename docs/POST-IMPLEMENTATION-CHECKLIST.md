# Post-Implementation Completion Checklist (All Stages)

This checklist is used after refactors and integrations are completed to verify readiness for release. It covers Stage 1–3 (infrastructure + dev/system/internal/monitoring + admin/users/roles/staff/schools/meetings) and cross-cutting concerns.

## Global Prerequisites
- Environment: `.env.local` used locally; `.env.example` committed with placeholders; no real secrets in repo.
- Secrets: `NEXTAUTH_SECRET`, Google, Pusher, Sentry, DB credentials sourced from secure store; rotated if previously exposed.
- Database: Migrations applied; seed data aligned with policy tests; rollback script prepared.
- Access: Minimum-privilege for CI/CD and infra tokens; no wildcards.

## Stage 1 — Infrastructure Stabilization
- Rate-Limit Flow: Under-quota returns `null` from rate-limit middleware; only 429 short-circuits.
- Audit Flow: Audit middleware returns `null` on success; final response includes security headers.
- Security Headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` present on protected routes and APIs.
- Public vs Policy: `/api/test-sentry` behavior consistent (public dev-only OR `DEV_DEBUG` enforced); middleware list matches `ApiRoutePolicy`.
- Policy Coverage: All sensitive path prefixes exist in `ApiRoutePolicy`; no unmapped sensitive routes.
- Logging: Middleware and auth logs don’t leak secrets; sensitive data masked.

## Stage 2 — Dev/System/Internal/Monitoring
- Dev Endpoints: `/api/dev/**`, `/api/debug/**`, `/api/tests/**`, `/api/test-sentry` guarded by `withAuth` + dev capability or `{ requireDevAdmin: true }`.
- System Endpoints: `/api/system/**` guarded by appropriate ops/dev capabilities (OPS_HEALTH/OPS_LOGS/OPS_DB_READ/DEV_UPDATE/etc.).
- Internal Endpoints: `/api/internal/**` restricted to dev-admin; no public exposure; network policies applied if applicable.
- Monitoring: `/api/monitoring/**` requires `OPS_MONITORING`/`OPS_LOGS`.
- Auditing: Critical calls emit audit events with action + metadata (userId, staffId, target, outcome); internal processor handles errors gracefully.

## Stage 3 — Admin/Users/Roles/Staff/Schools/Meetings
- Admin: `/api/admin/**` uses `withAuth` + `{ requireOpsAdmin: true }` or granular caps; all legacy role-title checks removed.
- Users: `/api/users/**` (admin ops) require `USER_MANAGE`; `/api/user/**` self-profile updates require `{ requireStaff: true }` with optional field ACL.
- Roles/Permissions: `/api/roles/**` requires `ROLE_MANAGE`; hierarchy/assignments mapped explicitly.
- Staff/Schools/Departments: Appropriate caps `SCHOOL_MANAGE`/`STAFF_IMPORT`; uploads rate-limited and audited.
- Meetings & Templates: `MEETING_VIEW/CREATE/EDIT/EDIT_OWN` enforced; ownership logic verified; default view requires auth.
- Pusher Auth: Organizer/attendee/admin allowed; others denied; presence payload sanitized.

## Client & UX Guards
- Capability Guards: Client-side checks rely on `capabilities` or admin flags, not role title strings.
- Redirects: Unauthed dashboard → `/auth/signin?callbackUrl=...`; insufficient capability → safe redirect/403 with user-friendly feedback.
- Visibility: Admin/system menus hidden without capability; deep-link attempts return 403 or redirect.

## Field-Level ACL (If Enabled)
- Response Filtering: `withFieldAccess` filters fields per model and user.
- Write Validation: Forbidden writes blocked with clear errors; partial updates validated.
- Context: `request.user` is attached before ACL wrappers run.

## NextAuth & Sessions
- Credentials: Bcrypt comparisons; 2FA integrated; errors localized; rate-limit enforced.
- OAuth (if enabled): `PrismaAdapter` configured; domain allowlist enforced; secure linking for existing users; pending/approval flow (if applicable).
- Callbacks: JWT/session callbacks enrich with staff, capabilities, admin flags; type conversions correct (token id string ↔ session id number).
- Cookies: httpOnly; secure in prod; SameSite appropriate; CSRF flows intact.

## Two-Factor Authentication (2FA)
- Setup/Verify/Disable: Endpoints operational; backup codes generated and consumed once; secrets stored securely.
- Policy: High-priv roles required to enable 2FA (if adopted); UX prompts present.
- Recovery: Documented recovery process; admin override flows audited.

## Testing & Quality Gates
- Unit: Policy (`can`, `canAccess*`, `getUserCapabilities`) ≥ 80% branches; rate-limit helpers tested.
- Integration: Middleware chain (rate-limit/auth/audit), admin/system/dev/internal/monitoring/users/roles/meetings endpoints.
- E2E: Login, redirects, 2FA flows, protected pages, capability-based UI visibility.
- Known Issues: Prior known-issue tests now green; no skipped tests for core auth.
- Coverage: Auth core modules ≥ 80% branches, ≥ 85% statements; API handlers ≥ 70% statements.

## CI/CD & Release
- Pipelines: Unit → Integration → E2E smoke on PR; nightly full E2E.
- Artifacts: JUnit, HTML, coverage uploaded; flaky retry threshold defined.
- Versioning: Change log updated; semantic version/tag produced.
- Rollback: Clear documented steps to revert deploy; DB rollback/migration down-scripts available.

## Observability & Runbooks
- Metrics: Auth success/failure rates; 2FA success; rate-limit hits; audit throughput.
- Alerts: Spike in 401/403/429; audit processor failures; unusual login sources.
- Sentry: User context set/cleared; PII policies respected; no noisy breadcrumbs.
- Runbooks: Incident response for auth outages, locked-out admin, audit queue failures.

## Security & Compliance
- Least Privilege: Admin caps only to intended roles; dev caps not available to school admins.
- Public Surface: Only intended public endpoints respond; others require auth.
- Data Handling: No sensitive fields leaked in API responses; output filtered.
- Pen Test Considerations: Token tampering thwarted by DB-enrichment on callback; capability drift tested.

## Data & Migration
- Migrations: All applied cleanly; no accidental data loss; backup taken pre-deploy.
- Backfill: Role/permission backfills completed; meeting ownership populated where needed.
- Idempotency: Seed and backfills safe to re-run.

## Documentation & Change Management
- Developer Docs: Updated `AUTH-ROADMAP.md`, `TEST-PLAN.md`, `OAUTH-PLAN.md`; setup and troubleshooting guides added.
- User Docs: Admin guide for approvals, role changes, and 2FA policy (if applicable).
- Stakeholder Sign-off: Security, Ops, Product approvals recorded.

## Post-Release Monitoring (Day 0–7)
- Dashboards: Monitor error rates, auth latencies, 2FA issues, rate-limit impacts.
- Feedback: Capture admin/user feedback; triage UI guard confusions.
- Hotfix Readiness: On-call and rollback prepared; audit trail verified for critical ops.

## Sign-off Matrix
- Security Review: Completed; notes archived.
- QA Sign-off: All P0/P1 tests passed; waivers documented if any.
- Ops Sign-off: Observability and runbooks verified; alerts tuned.
- Product Sign-off: UX guard behavior and flows accepted.


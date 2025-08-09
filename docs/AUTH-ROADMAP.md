# Admin API Policy Compliance Roadmap (Stage 1–3)

## Goals
- Replace all legacy, role-title based checks with capability/policy + `withAuth` presets.
- Ensure middleware chain (rate-limit → auth/policy → audit → headers) is correct and non-bypassable.
- Align public endpoints with `ApiRoutePolicy`; no contradictory behavior.
- Standardize auditing for critical actions; keep responses consistent (401 anon, 403 insufficient, 429 rate-limit, 400 validation).

## Prerequisites (Blockers)
- Rate-limit middleware: on success, return `null` (not `NextResponse.next()`); only short-circuit on 429.
- Audit middleware: on success, return `null` (or allow final response consolidation) so security headers are applied.
- Public vs policy: pick one behavior for `/api/test-sentry` (dev-only public OR require `DEV_DEBUG`); keep middleware and `ApiRoutePolicy` consistent.

## Stage 1 — Infrastructure Stabilization & Policy Coverage
1) Fix rate-limit middleware flow (success → null, 429 → response).
2) Fix audit middleware flow (success → null; ensure final response has security headers).
3) Decide and enforce `/api/test-sentry` policy (dev-only public vs capability).
4) Audit `ApiRoutePolicy` coverage: ensure all sensitive prefixes are mapped (dev/debug/tests, system, internal, admin, users, roles, monitoring, staff/schools/departments, meetings, templates).

Acceptance
- Auth/policy checks run even on rate-limited paths (when under quota).
- Security headers present on 2xx/4xx.
- Public endpoints consistent with policy mapping.

## Stage 2 — Harden Dev/System/Internal/Monitoring Handlers
- `/api/dev/**`, `/api/debug/**`, `/api/tests/**`, `/api/test-sentry`:
  - Add `withAuth` + `{ requireDevAdmin: true }` or `requireCapability: DEV_*` per endpoint semantics.
  - Remove any legacy role-title checks.
- `/api/system/**`:
  - Add `withAuth` + appropriate capability (OPS_HEALTH/OPS_LOGS/OPS_DB_READ/DEV_UPDATE/LINT/FIX).
- `/api/internal/**`:
  - Add `withAuth` + `{ requireDevAdmin: true }`.
- `/api/monitoring/**`:
  - Add `withAuth` + `OPS_MONITORING`/`OPS_LOGS`.

Acceptance
- Anonymous: 401; non-dev/non-ops: 403; dev/ops admin: 2xx.
- Auditing active for critical calls.

## Stage 3 — Harden Admin/Users/Roles/Staff/Schools/Meetings
- `/api/admin/**`:
  - `withAuth` + `{ requireOpsAdmin: true }` or granular capabilities (e.g., USER_MANAGE, ROLE_MANAGE, OPS_LOGS).
  - Remove `getServerSession + Administrator` role-title checks.
- `/api/users/**` and `/api/user/**`:
  - Admin operations: `withAuth` + USER_MANAGE.
  - Self-profile updates: `withAuth` + `{ requireStaff: true }` (optionally field-level ACL).
- `/api/roles/**`:
  - `withAuth` + ROLE_MANAGE (and derivatives for hierarchy/assignments when needed).
- `/api/staff/**`, `/api/schools/**`, `/api/school`, `/api/departments`:
  - `withAuth` + SCHOOL_MANAGE / STAFF_IMPORT.
- `/api/meetings/**`, `/api/meeting-templates/**`:
  - `withAuth` + MEETING_* capabilities; use `MEETING_EDIT_OWN` with context for ownership.

Acceptance
- Capability-driven access across all admin and management endpoints; legacy checks removed.

## Cross-Cutting Actions
- Client guards (UI): replace `role.title === 'Administrator'` checks with capability/admin flags.
- Field-level ACL (optional): when enabled, attach `request.user` for `withFieldAccess` and validate writes.
- Audit standardization: log action + metadata (userId, staffId, targetId, outcome) for admin/role/perm/user/staff critical ops.
- Env hygiene: remove real secrets from repo; single `NEXTAUTH_SECRET`; provide `.env.example`.

## Acceptance Criteria (Global)
- All sensitive path prefixes mapped in `ApiRoutePolicy`.
- All protected handlers start with `withAuth` + preset/requireCapability.
- Middleware chain preserved; headers present; no bypass.
- Tests green for P0/P1; coverage meets targets.

## Risks & Mitigations
- Wrong capability mapping → unit tests for `can`/`canAccess*` and seed-driven integration tests.
- UI regression → E2E smoke on menus/visibility; quick rollback path.
- Performance overhead → observe and optimize (cache, fewer DB calls in callbacks).

## Work Packages (Tickets)
- A1-x: Middleware fixes + public/policy alignment (3–4 tickets)
- A2-x: Dev/System/Internal/Monitoring hardening (4–6 tickets)
- A3-x: Admin/Users/Roles/Staff/Schools/Meetings (8–12 tickets)
- CX-x: Client guards, Field ACL, Audit standardization (3–6 tickets)
- TX-x: Tests (unit/integration/E2E) updates (6–10 tickets)

## Timeline (Estimates)
- Stage 1: 1–2 days
- Stage 2: 2–4 days
- Stage 3: 4–7 days
- Test stabilization: 2–3 days

## Deliverables
- Refactored handlers with `withAuth` + capability presets.
- Updated middleware with correct flow and security headers.
- Updated client guards.
- Passing test suites and coverage reports.


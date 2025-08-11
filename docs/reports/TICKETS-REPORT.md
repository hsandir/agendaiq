# Tickets Report — Admin API Refactor (Stage 1–3) and OAuth Rollout

This report consolidates actionable tickets with IDs, scope, acceptance criteria, dependencies, test references, and rough estimates. It covers Stage 1–3 Admin API policy refactor and the Google OAuth rollout.

## Legend
- ID Prefixes: A1 (Stage 1 infra), A2 (Stage 2 dev/system/internal/monitoring), A3 (Stage 3 admin/users/roles/staff/schools/meetings), CX (cross-cutting), TX (tests), G (OAuth)
- Estimates: S (≤0.5d), M (0.5–1d), L (1–2d), XL (>2d)
- Test IDs: Refer to `docs/TEST-PLAN.md`

---

## Stage 1 — Infrastructure Stabilization Tickets

- A1-01: Fix rate-limit middleware success flow
  - Desc: On success (under quota) return `null` instead of `NextResponse.next()` so `middleware.ts` continues auth/policy checks; only 429 short-circuits.
  - Acceptance: AUTH-MWINT-01 passes; under-quota requests reach auth/policy; over-quota returns 429 with headers.
  - Deps: None.
  - Tests: AUTH-RL-01/02, AUTH-MWINT-01/02.
  - Est: S

- A1-02: Fix audit middleware flow and preserve security headers
  - Desc: Return `null` on success or restructure `middleware.ts` to apply security headers on the final response; do not short-circuit.
  - Acceptance: AUTH-MWINT-03 shows required headers on 2xx/4xx; audit events still logged.
  - Deps: A1-01.
  - Tests: AUTH-MWINT-03, AUTH-INT-17.
  - Est: S

- A1-03: Align `/api/test-sentry` public vs policy
  - Desc: Choose one behavior (dev-only public OR `Capability.DEV_DEBUG` required) and update `middleware.ts`, `policy.ts`, and route docstrings accordingly.
  - Acceptance: Behavior matches decision in both middleware and policy; tests reflect chosen path.
  - Deps: A1-01/02 (for chain correctness).
  - Tests: Public vs Policy Consistency; AUTH-E2E-06.
  - Est: S

- A1-04: Audit `ApiRoutePolicy` coverage for sensitive paths
  - Desc: Ensure all sensitive prefixes (dev/debug/tests, system, internal, admin, users, roles, monitoring, staff/schools/departments, meetings/templates) are mapped.
  - Acceptance: No unmapped sensitive routes; additions documented in `policy.ts`.
  - Deps: None.
  - Tests: AUTH-POL-05 via integration smoke.
  - Est: S

---

## Stage 2 — Dev/System/Internal/Monitoring Tickets

- A2-01: Harden `/api/dev/**` endpoints
  - Desc: Add `withAuth` + `{ requireDevAdmin: true }` or `requireCapability: DEV_DEBUG` (and DEV_UPDATE/LINT/FIX where relevant). Remove any legacy checks.
  - Acceptance: Anon 401; non-dev 403; dev-admin 2xx; audit present for critical ops.
  - Deps: A1-01/02/03.
  - Tests: AUTH-INT-12, AUTH-INT-17; per-endpoint unit tests optional.
  - Est: M

- A2-02: Harden `/api/debug/**` and `/api/tests/**`
  - Desc: Same as A2-01.
  - Acceptance: As above.
  - Deps: A1-01/02/03.
  - Tests: AUTH-INT-12.
  - Est: S–M

- A2-03: Finalize `/api/test-sentry` gating per decision
  - Desc: Implement chosen policy (dev-only public or capability).
  - Acceptance: Reflects decision; tests green.
  - Deps: A1-03.
  - Tests: AUTH-E2E-06.
  - Est: S

- A2-04: Harden `/api/system/**`
  - Desc: Add `withAuth` + OPS_* or DEV_* per route (OPS_HEALTH/OPS_LOGS/OPS_DB_READ/DEV_UPDATE/LINT/FIX). Remove ad-hoc checks.
  - Acceptance: Ops/dev admins pass; unauthorized 403/401; audit present.
  - Deps: A1-01/02/04.
  - Tests: AUTH-INT-12; header checks via AUTH-MWINT-03.
  - Est: M–L

- A2-05: Restrict `/api/internal/**` to dev-admin
  - Desc: `withAuth` + `{ requireDevAdmin: true }`. Ensure no public exposure; verify audit processing stability.
  - Acceptance: Only dev-admin; audit POST handles payloads and errors.
  - Deps: A1-01/02.
  - Tests: AUTH-INT-17.
  - Est: S

- A2-06: Harden `/api/monitoring/**`
  - Desc: `withAuth` + `OPS_MONITORING`/`OPS_LOGS`; ensure log/read segregation where needed.
  - Acceptance: Ops-only; others 403; audit for sensitive queries.
  - Deps: A1-01/02, A1-04.
  - Tests: AUTH-INT Monitoring items.
  - Est: M

---

## Stage 3 — Admin/Users/Roles/Staff/Schools/Meetings Tickets

- A3-01: Admin endpoints `/api/admin/**`
  - Desc: Replace legacy session+role.title checks with `withAuth` + `{ requireOpsAdmin: true }` or granular caps (e.g., USER_MANAGE, ROLE_MANAGE, OPS_LOGS).
  - Acceptance: Legacy checks removed; capability gates enforced; responses 401/403/2xx as appropriate.
  - Deps: A1-01/02/04.
  - Tests: AUTH-INT-11; audit events for critical ops.
  - Est: L

- A3-02: Users endpoints `/api/users/**`
  - Desc: Admin operations require `USER_MANAGE`; rate-limit and audit heavy operations.
  - Acceptance: Capability-driven; logs present; errors 401/403/429 as designed.
  - Deps: A1-01/02.
  - Tests: User management integration; AUTH-INT admin items.
  - Est: M–L

- A3-03: Self profile `/api/user/**`
  - Desc: `withAuth` + `{ requireStaff: true }`; optional field-level ACL for sensitive attributes.
  - Acceptance: User can update allowed fields; forbidden fields blocked; clear 400 errors.
  - Deps: CX-02 (if ACL enabled).
  - Tests: AUTH-INT-16, profile integration tests.
  - Est: M

- A3-04: Roles `/api/roles/**`
  - Desc: `withAuth` + `ROLE_MANAGE`; department assignments/hierarchy covered.
  - Acceptance: Non-managers 403; managers 2xx; audit on changes.
  - Deps: A1-04.
  - Tests: AUTH-INT admin/roles; policy unit tests.
  - Est: M

- A3-05: Staff/Schools/Departments
  - Desc: `withAuth` + `SCHOOL_MANAGE`/`STAFF_IMPORT`; uploads rate-limited + audited.
  - Acceptance: Proper caps enforced; rate-limit headers on bulk ops; audit logged.
  - Deps: A1-01/02.
  - Tests: Integration tests for import/manage.
  - Est: M–L

- A3-06: Meetings & Templates
  - Desc: `withAuth` + meeting caps; `MEETING_EDIT_OWN` ownership checks with context; default view requires auth.
  - Acceptance: Own meeting edits allowed; others require EDIT; view requires VIEW/auth.
  - Deps: A1-04.
  - Tests: AUTH-INT-13; ownership unit tests for `can`.
  - Est: M

- A3-07: Pusher Auth
  - Desc: Organizer/attendee/admin allowed; unrelated 403; malformed channel 400; presence payload sanitized.
  - Acceptance: Matches rules; no overexposure of user data.
  - Deps: A3-06 (meeting ids/ownership).
  - Tests: AUTH-INT-14/15.
  - Est: S–M

---

## Cross-Cutting Tickets

- CX-01: Client guards → capabilities/admin flags
  - Desc: Replace role-title checks in client (e.g., system page) with capability/admin flag logic.
  - Acceptance: UI visibility reflects caps; deep-link attempts blocked by server.
  - Deps: A1-04 (accurate caps mapping).
  - Tests: AUTH-E2E-05; component tests.
  - Est: S–M

- CX-02: Field-level ACL enablement (optional)
  - Desc: When used, attach `request.user` before `withFieldAccess`; configure model rules.
  - Acceptance: Filtered responses; write validation errors for forbidden fields; logs without PII.
  - Deps: Handler updates.
  - Tests: AUTH-INT-16.
  - Est: M–L

- CX-03: Audit standardization
  - Desc: Emit action + metadata uniformly across admin/roles/users/staff critical ops; error paths logged.
  - Acceptance: Internal audit processor handles all; idempotent; no PII leakage.
  - Deps: A1-02.
  - Tests: AUTH-INT-17.
  - Est: S–M

- CX-04: Env/secret hygiene
  - Desc: Remove secrets from repo; `.env.example` with placeholders; ensure single `NEXTAUTH_SECRET`.
  - Acceptance: CI passes with `.env.test`; local dev uses `.env.local`.
  - Deps: None.
  - Tests: Build/test run using example/test envs.
  - Est: S

- TX-01: Known-issue tests (middleware chain)
  - Desc: Land tests that fail until A1 fixes are merged; then turn green.
  - Acceptance: AUTH-MWINT-01/03 pass after fixes.
  - Deps: A1-01/02.
  - Tests: As above.
  - Est: S

- TX-02: Capability & ownership coverage
  - Desc: Expand tests for `can`, `canAccess*`, meeting ownership, and admin ops.
  - Acceptance: Coverage targets met; edge cases included.
  - Deps: A1-04, A3-06.
  - Tests: AUTH-POL-*, AUTH-INT-13.
  - Est: M

---

## Google OAuth Rollout Tickets

- G1-01: Add PrismaAdapter and sanitize env
  - Desc: Configure `PrismaAdapter(prisma)`; move `GOOGLE_CLIENT_ID/SECRET` to secrets; add placeholders to `.env.example`.
  - Acceptance: OAuth users persisted; no secrets in repo.
  - Deps: None.
  - Tests: Build, basic sign-in mock; env checks.
  - Est: S

- G2-01: Implement `callbacks.signIn` domain allowlist
  - Desc: Deny disallowed domains; allow allowed ones.
  - Acceptance: Allowed domain passes; others denied with clear messaging.
  - Deps: G1-01.
  - Tests: AUTH-INT-21.
  - Est: S

- G2-02: Secure linking for existing credentials users
  - Desc: If credentials user exists for verified email, require confirmation/admin approval (per policy) before linking; prevent takeover.
  - Acceptance: No takeover; explicit linking step; audit logs created.
  - Deps: G1-01, G2-01.
  - Tests: AUTH-INT-22.
  - Est: M

- G2-03: Pending/approval flow for new OAuth users (optional)
  - Desc: New users flagged pending/limited until admin approval; UI copy guides next steps.
  - Acceptance: Pending cannot access protected areas; post-approval enrichment applies on next session update.
  - Deps: G1-01.
  - Tests: AUTH-INT-23; E2E messaging.
  - Est: M–L

- G3-01: Ensure JWT/session enrichment parity for OAuth
  - Desc: OAuth users get the same enrichment (staff, caps, flags) via callbacks; no divergence.
  - Acceptance: Session reflects DB changes; removal of caps appears on update.
  - Deps: G1-01.
  - Tests: AUTH-INT enrichment checks.
  - Est: S–M

- G4-01: Enforce 2FA for high-priv OAuth users (optional)
  - Desc: Require 2FA setup for dev/ops admins after OAuth login; guide users to setup flow.
  - Acceptance: High-priv cannot access admin/system until 2FA enabled.
  - Deps: Existing 2FA endpoints.
  - Tests: AUTH-INT-24; E2E guidance.
  - Est: M

- G5-01: Audit & Sentry for OAuth flows
  - Desc: Log attempt/success/failure with `provider=google`; ensure `AuthProvider` sets/clears Sentry user context.
  - Acceptance: Events visible; Sentry user context correct.
  - Deps: A1-02 (audit chain).
  - Tests: Audit/Sentry integration.
  - Est: S

- G6-01: Sign-in UI copy updates
  - Desc: Inform about domain restrictions and linking/approval expectations.
  - Acceptance: Clear UX; translations (if any) updated.
  - Deps: G2-01/02/03.
  - Tests: Visual/UX checks; E2E smoke.
  - Est: S

- G7-01: OAuth test suites
  - Desc: Add unit/integration/E2E tests covering allowlist, linking, pending, enrichment, 2FA, rate-limit, audit.
  - Acceptance: Suites pass; coverage targets met.
  - Deps: G1–G6.
  - Tests: AUTH-INT-21..24 + E2E.
  - Est: M–L

---

## Scheduling & Dependencies Summary
- Complete Stage 1 (A1-01..04) before Stage 2/3 and OAuth audit reliance.
- Parallelizable: A2 tickets mostly parallel after Stage 1; A3 parallel with care on shared modules; CX/TX can run alongside.
- OAuth: G1 → G2 → (G3,G4,G5,G6) → G7.

## Reporting & Sign-off
- Each ticket to include PR checklist referencing acceptance tests and coverage.
- Post-merge, update `AUTH-ROADMAP.md` progress and ensure `POST-IMPLEMENTATION-CHECKLIST.md` items are satisfied.


# Google OAuth Implementation Plan

## Decision
- Proceed with full integration using `PrismaAdapter` so OAuth users persist in DB and policy enrichment remains reliable.

## Architecture
- NextAuth v4, JWT sessions.
- Providers: Credentials + Google.
- Adapter: `PrismaAdapter(prisma)` (adds `Account` records and persists Google-linked users).
- Enrichment: Existing JWT/session callbacks fetch staff/role/permissions from DB.

## Security & Policy
- Domain allowlist: Only approved domains (e.g., `@cjcollegeprep.org`); others denied.
- Account linking:
  - If a credentials account exists for the same verified email, enable secure linking (email confirmation or admin approval).
  - Deny takeover; no silent overrides.
- Admin approval (optional): New OAuth users start as pending/limited until approved.
- 2FA policy (optional): Require 2FA for high-privilege (ops/dev admin) OAuth users.
- Rate limiting: Apply global limits for OAuth login attempts (IP/UA-based tokenization).
- Auditing: Log attempt/success/failure with `provider=google` metadata.

## UX Flows
- Sign-in: “Continue with Google” + credentials.
- First Google login:
  - Disallowed domain → deny with info + help.
  - Existing credentials user → secure linking flow (confirmation/admin approval).
  - New user → pending/limited access (or admin approval screen) per policy.
- Post-login: JWT enriched; UI shows capabilities-driven sections.
- Account settings (future): Manage linked providers.

## Technical Tasks
- G1: Add `PrismaAdapter(prisma)` and sanitize env (`GOOGLE_CLIENT_ID/SECRET` only in `.env.local`/CI vault; `.env.example` placeholders).
- G2: Implement `callbacks.signIn` logic:
  - Domain allowlist check.
  - Secure linking for existing credentials users.
  - Pending/approval logic for new users.
- G3: Ensure JWT/session enrichment works identically for OAuth users.
- G4: Implement/Enforce 2FA policy for high-priv roles (optional) with UX prompts.
- G5: Add audit events for OAuth flows; verify `AuthProvider` sets Sentry context.
- G6: Update sign-in UI copy for domain restrictions and linking/approval messaging.

## Tests (OAuth-specific)
- Allowed vs denied domain.
- Existing credentials user + Google → linking required; no takeover.
- New user pending/approval flows; enrichment after approval.
- High-priv OAuth users must setup 2FA before accessing admin/system areas (if policy enabled).
- Rate-limit behavior on repeated OAuth attempts; proper headers.
- Audit events with `provider=google`; Sentry user context.

## Rollout
- R1: Add adapter + provider; test internally (allowlist off).
- R2: Turn on allowlist; beta with limited users (pending off or on).
- R3: Enable approval flow + admin UI for pending users (future sprint).
- R4: Enforce 2FA policy for high-priv roles (optional) with user guidance.
- R5: Monitor success/error rates; audit dashboard for visibility.

## Acceptance Criteria
- OAuth users persisted in DB; enrichment provides correct flags/capabilities.
- Domain, linking, and approval policies prevent takeover and misattribution.
- Test suites pass; coverage targets met; audit logs reflect provider.


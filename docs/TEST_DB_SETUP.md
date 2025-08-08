Test Database Setup (Postgres via Docker)

Prerequisites
- Docker installed and running locally.
- Port `5432` available (or adjust compose file and `.env.test`).

Start Postgres
- Command: `cd agendaiq && docker compose up -d postgres-test`
- Verifies health with `pg_isready` in the container healthcheck.

Prepare Schema
1) Export test env variables in current shell:
   - macOS/Linux: `set -a; source .env.test; set +a`
   - Or: `export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agendaiq_test"`
2) Apply schema and seed:
   - Initial: `npx prisma db push`
   - Or migrations: `npx prisma migrate deploy`
   - Seed: `npx prisma db seed`

Reset Between Runs (optional)
- `set -a; source .env.test; set +a && npx prisma migrate reset --force`

Run Tests
- Unit/Integration (Jest): `npm test`
- E2E (Playwright): ensure app running, then `npm run test:e2e`

Notes
- `.env.test` points `DATABASE_URL` to `localhost:5432` with `postgres/postgres` and DB `agendaiq_test`.
- Seed creates: 1 District, 1 School, 1 Department, 1 Role, 3 Users + Staff (password `Password123!`).
- If port 5432 is taken, edit `docker-compose.yml` (ports) and `.env.test` accordingly.


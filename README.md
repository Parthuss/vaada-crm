# Vaada

**Every promise, followed through.** Vaada is an AI-assisted lead CRM for Indian SMEs. It puts overdue commitments before vanity metrics and keeps Gemini useful, structured, and firmly under salesperson control.

> Deployment status: the application is production-ready locally. The public URL and monitoring screenshot are added after the owner connects a free Neon database, Gemini key, and Vercel project.

## What reviewers can do

- Sign in with a seeded demo account.
- Create, search, edit, archive, and move leads through six pipeline stages.
- Schedule, edit, complete, and review due/overdue follow-ups in `Asia/Kolkata` time.
- Scan an attention-led dashboard and horizontal pipeline board.
- Generate three distinct AI outputs: structured lead insight, editable WhatsApp/message draft, and a daily sales brief.
- Save selected AI results without auto-sending or auto-mutating CRM data.
- Observe safe rules-based fallbacks when Gemini is unavailable.

## Stack

Next.js 16 App Router, React 19, TypeScript, PostgreSQL, Prisma 7, Auth.js/NextAuth credentials, Gemini via `@google/genai`, Zod 4 structured-output validation, Vitest, and self-hosted Inter Variable. The app is a modular monolith designed for one free Vercel deployment and a free Neon Postgres database.

## Run locally

Prerequisites: Node.js 20+, npm, and PostgreSQL.

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use:

```text
Email: demo@vaada.app
Password: VaadaDemo2026!
```

The seed is repeatable and rebuilds data only for the configured demo user.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled PostgreSQL connection string with TLS. |
| `AUTH_SECRET` | Yes | Signs session JWTs. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes | Canonical app URL, e.g. `http://localhost:3000`. |
| `GEMINI_API_KEY` | For Gemini | Server-only key from Google AI Studio. The app remains useful without it via fallbacks. |
| `GEMINI_MODEL` | No | Defaults to stable `gemini-3.5-flash-lite`. |
| `DEMO_EMAIL` | No | Seeded demo email; defaults to `demo@vaada.app`. |
| `DEMO_PASSWORD` | No | Seeded demo password; change outside the assessment demo. |
| `APP_VERSION` | No | Commit SHA/version returned by `/api/health`. |

Never prefix `GEMINI_API_KEY`, `DATABASE_URL`, or `AUTH_SECRET` with `NEXT_PUBLIC_`.

## Gemini architecture

All model calls originate in [`src/lib/ai/gemini.ts`](./src/lib/ai/gemini.ts), never the browser. Each use case has its own task instruction, minimized context builder, Zod schema, and deterministic fallback.

1. Stable system policy separates model rules from untrusted lead context.
2. Lead insight and daily brief omit phone/email; message drafting includes only the contact's first name.
3. Zod JSON Schema is sent to Gemini, and every response is parsed and validated again server-side.
4. Requests time out at 12 seconds, transient failures retry once with jitter, and every result category/duration/retry count is logged to Postgres.
5. A database-backed five-requests-per-minute/user guard works across serverless instances.
6. Invalid lead IDs in a daily brief are rejected. UI fallbacks remain usable and clearly labelled.

See [DECISIONS.md](./DECISIONS.md) for trade-offs and [architecture](./docs/ARCHITECTURE.md) for flows and scaling changes.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Current automated result: 22 tests pass; core domain/AI logic has 91.66% line coverage and 90.19% statement coverage. The live Gemini transport is excluded from unit coverage and is verified as an environment-backed integration.

## Deploy on free tiers

1. Create a free Neon Postgres database and copy its pooled connection string to `DATABASE_URL`.
2. Add all environment variables to Vercel; set `NEXTAUTH_URL` to the final HTTPS domain.
3. Run `npm run db:migrate` and `npm run db:seed` against the production database once.
4. Import the repository into Vercel. `postinstall` generates Prisma Client and `npm run build` builds Next.js.
5. Configure UptimeRobot's free HTTP monitor to request `https://YOUR_DOMAIN/health` every five minutes and alert when the response is not `200`.
6. Use Vercel function logs for structured error records; AI request outcomes and durations are also queryable from `AIRequest`.

### Live submission fields

- Live URL: `PENDING_OWNER_DEPLOYMENT`
- Demo login: `demo@vaada.app` / `VaadaDemo2026!`
- Health URL: `PENDING_OWNER_DEPLOYMENT/health`
- Uptime proof: add screenshot/link to `docs/monitoring-proof/` after the monitor is created.

## Repository map

- `src/app/(app)` — authenticated product screens.
- `src/app/api` — owner-scoped REST and AI endpoints.
- `src/lib/ai` — context minimization, schemas, Gemini adapter, fallbacks, resilience.
- `prisma` — schema, deployable migration, and realistic repeatable seed.
- `specs/vaada-crm.md` — validated 100/100 implementation specification.
- `PRODUCT.md`, `DESIGN.md`, `docs/DESIGN_RESEARCH.md` — product and evidence-backed design rationale.

## Security and production improvements

This assessment uses credentials auth for a controlled demo. Production would use verified email/OIDC, password reset, audit trails, encrypted sensitive fields, retention controls, CSRF/security testing, per-tenant roles, a managed rate limiter, queue-backed AI jobs, OpenTelemetry/Sentry, and prompt/response evals. See `DECISIONS.md` for the multi-tenant path.

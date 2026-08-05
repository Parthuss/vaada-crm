# 15-minute live demo plan

## Product walkthrough — 6 minutes

1. **Login (20s):** use the pre-filled demo account; mention bcrypt and JWT sessions.
2. **Dashboard (60s):** explain why overdue promises lead the page. Open Saffron Kitchens from the attention queue.
3. **Lead (90s):** update its status or note, save, and show follow-up history. Call out optimistic concurrency.
4. **Gemini on a lead (90s):** generate structured insight, then an editable WhatsApp draft. Edit a sentence and save it. Explain that nothing auto-sends.
5. **Follow-ups + pipeline (60s):** complete an overdue item, schedule a new promise, and scan the stage board.
6. **Daily brief (40s):** generate the ranked brief; open one cited lead. If Gemini is intentionally disabled, demonstrate the labelled useful fallback.

## System design — 9 minutes

Open `docs/ARCHITECTURE.md` and cover:

- Browser → Next.js route handler → owner-scoped Prisma → Neon.
- Credentials authentication and why every data query also scopes by `ownerId`.
- Separate system/task/context layers, field minimization, JSON Schema + Zod, real-lead-ID verification.
- 12-second timeout, one transient retry, Postgres rate limiting, categorized telemetry, fallback UX.
- One Vercel deploy, `/health`, UptimeRobot, and Vercel logs.
- Multi-tenant evolution: tenant/membership, repository enforcement + RLS, Redis limits, queued AI, observability, and aggregates.

## Files worth having open

- `src/lib/ai/gemini.ts`
- `src/lib/ai/context.ts`
- `src/lib/ai/schemas.ts`
- `src/app/api/ai/daily-brief/route.ts`
- `src/app/api/leads/[id]/route.ts`
- `prisma/schema.prisma`
- `DECISIONS.md`

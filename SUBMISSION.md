# Vaada — submission

Copy the fields below into whatever form or email QRYX asks for. Everything here was re-verified live on 7 August 2026.

## Submission fields

- **Live URL:** https://vaada-crm.vercel.app
- **Repository:** https://github.com/Parthuss/vaada-crm
- **Demo login:** `demo@vaada.app` / `VaadaDemo2026!`
- **Health check:** https://vaada-crm.vercel.app/api/health → `{"status":"ok","database":"ok","version":"f53f0d1"}`
- **Uptime monitor:** https://github.com/Parthuss/vaada-crm/actions/workflows/uptime.yml (public, runs every 5 minutes)
- **Monitoring proof / how to verify:** [`docs/monitoring-proof/README.md`](./docs/monitoring-proof/README.md)
- **Architecture diagram:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- **Design rationale:** [`DESIGN.md`](./DESIGN.md), [`docs/DESIGN_RESEARCH.md`](./docs/DESIGN_RESEARCH.md)
- **Product rationale:** [`PRODUCT.md`](./PRODUCT.md)
- **Engineering trade-offs:** [`DECISIONS.md`](./DECISIONS.md)
- **Formal spec (FR/NFR/AC/EC) the build is audited against:** [`specs/vaada-crm.md`](./specs/vaada-crm.md)
- **Demo script:** [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md)
- **Live session prep:** [`docs/PRESENTATION.md`](./docs/PRESENTATION.md) (15-min run sheet), [`docs/system-design-deck.html`](./docs/system-design-deck.html) (slides), [`docs/INTERVIEW_GUIDE.md`](./docs/INTERVIEW_GUIDE.md) (Q&A prep)
- **Demo video:** `vaada-demo.mp4` — 7m24s, captioned, no audio. **Not a required deliverable** (the demo is presented live), kept as rehearsal material and as a fallback if the deployment or Gemini misbehaves mid-call. Gitignored, so it isn't in the repo.

## What a reviewer can do without any setup

Sign in with the demo login above and, in any order:

1. Browse leads as a table and as a pipeline board (same data, two views); drag a card between stages or use the keyboard-accessible stage select.
2. Open a lead, schedule/edit/complete a follow-up, and watch it move between overdue/today/upcoming.
3. Check the dashboard's attention queue (overdue-first ordering) and the Pipeline shape card.
4. Generate a lead insight, a WhatsApp/message draft, and a daily sales brief from Gemini — edit or dismiss before saving; nothing sends or mutates data automatically.
5. Turn off `GEMINI_API_KEY` (or wait for a rate limit) to see the rules-based fallback UI.

## Local run (if QRYX wants to run it themselves)

```bash
cp .env.example .env.local   # fill in DATABASE_URL, AUTH_SECRET, GEMINI_API_KEY
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Full instructions, environment variable table, and deploy steps are in [`README.md`](./README.md).

## Known, honestly-documented gaps

Rather than leave these implicit, they're called out explicitly in [`DECISIONS.md`](./DECISIONS.md#testing-scope):

- Global line coverage is 6.34%, short of the self-imposed 60% target in `specs/vaada-crm.md`'s NFR-9 — only `src/lib/domain` and `src/lib/ai` are unit-tested (97.36% lines / 95.38% branches there, clearing the 80% branch bar). Routes, pages, and components are covered by manual QA against the live deployment, not automated tests.
- Lighthouse was run against `/login` only (99 performance / 100 accessibility / 100 best-practices / 100 SEO) — authenticated routes (`/dashboard`, `/leads`, `/pipeline`) weren't measured because the CLI doesn't carry a session cookie through the credentials login flow.

## Pre-submission checklist

- [x] Live app reachable and functional
- [x] `/health` and `/api/health` return `status: ok`, `database: ok`
- [x] Demo credentials work
- [x] Uptime workflow public and running
- [x] README covers env vars, local run, deploy steps, demo credentials
- [x] DECISIONS.md covers architecture, AI approach, trade-offs, and honest gaps
- [x] Architecture diagram present and accurate
- [x] Demo script present
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all pass on the submitted commit (`f53f0d1`, plus one docs-only commit `5af027d` on top)
- [x] No secrets committed (`.env*` gitignored except `.env.example`)

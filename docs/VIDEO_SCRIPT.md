# Demo video — spoken script

A read-aloud script for the ~15-minute walkthrough outlined in [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md). Say it in your own words rather than reading verbatim — the point is to hit every beat, not recite. Bracketed lines are stage directions (what to click/show), not narration. Record the product walkthrough as a screen share of the live app at [vaada-crm.vercel.app](https://vaada-crm.vercel.app); have `docs/ARCHITECTURE.md` and the files listed at the bottom open in an editor tab for the system-design half.

Total runtime target: ~15 minutes (6 product + 9 system design). If you need a shorter cut for a submission portal with a time limit, the 6-minute product walkthrough alone stands on its own — see the note at the end.

---

## Cold open (15s)

> "Hi, I'm [name]. This is Vaada — a lead CRM I built for this assessment, for small Indian sales teams. The whole idea is in the name: 'vaada' means a promise. The product's job is to make sure promises to customers don't get missed — not to be another spreadsheet with a dashboard bolted on. I'll walk through the product for about six minutes, then spend the rest of the time on how it's built and why."

[Screen: production URL already loaded, logged out]

---

## Product walkthrough (~6 min)

### 1. Login (20s)

[Type the seeded demo credentials, or paste them]

> "I'm signing in with a seeded demo account — credentials auth with bcrypt-hashed passwords and a JWT session. No magic links or third-party OAuth for this assessment, but I'll talk about what I'd change for production later."

### 2. Dashboard (60s)

[Land on `/dashboard`]

> "This is the dashboard, and it's deliberately not a metrics wall. The first thing you see is the attention queue — every overdue or due-today follow-up, sorted overdue-first, then by how late it is. That's the core product bet: what needs you *right now* matters more than a chart of lead counts.

> On the right, Pipeline shape shows the six-stage funnel with real counts, and Recent activity shows momentum — leads that moved forward recently. Both of those are real, non-redundant numbers; I cut a separate KPI strip that was just re-showing the same overdue/due-today counts a second time in card form, because that's exactly the kind of dashboard clutter I was trying to avoid."

[Click into a lead from the attention queue — e.g. Saffron Kitchens]

### 3. Lead detail (90s)

[On the lead detail page]

> "Here's a single lead — contact info, notes, pipeline status, and its full follow-up history. I can edit the status or notes and save."

[Make a small edit, save]

> "One thing worth calling out: saves use optimistic concurrency. If this lead changed in another tab or another teammate's session between when I loaded it and when I save, the server rejects the write with a conflict instead of silently overwriting their change. That's a real edge case for a team CRM, not a hypothetical."

### 4. Gemini on a lead (90s)

[Trigger lead insight generation]

> "Now the AI side. This calls Gemini server-side — the API key never touches the browser — with a minimized context: stage, a value band instead of the raw deal amount, industry, source, and recent follow-ups. No phone number, no email, no full name goes into the prompt for this use case.

> The response comes back as strict JSON, validated against a Zod schema before it ever reaches the UI. If Gemini returns something that doesn't fit the schema, or invents a lead ID that doesn't belong to this user, it's rejected — not shown."

[Generate a WhatsApp/message draft, edit a sentence, save]

> "Same pattern for the message draft, except this one's meant to be edited — it's a starting point, not a send button. I'll tweak a line here... and save it. Nothing in this product ever sends a message or changes a lead automatically on the AI's say-so. Every save is a deliberate human action."

### 5. Follow-ups and pipeline (60s)

[Go to Follow-ups, complete an overdue item, schedule a new one]

> "Follow-ups: I can complete this overdue one — that stamps a completion time but doesn't touch the lead's status or fire off any message, which was a specific requirement I held to. And I can schedule a new promise here."

[Go to Pipeline board, drag a card between stages]

> "The pipeline board is the same lead data as the table view, just laid out by stage. Cards are draggable, and there's a keyboard-accessible fallback — a stage select — for anyone who can't or doesn't want to drag-and-drop."

### 6. Daily brief (40s)

[Go to AI brief, generate/refresh]

> "Last AI surface: the daily brief. It looks across up to thirty active leads — no names, phone numbers, or emails in this context, just enough to prioritize — and comes back with a ranked list of what needs attention, risks, and momentum. I can dismiss any item I don't care about, edit the summary, and only then save it. It also persists — if I click through to a lead and come back, the brief is still here, not regenerated from scratch."

[If Gemini is deliberately disabled for the recording: trigger it, show the fallback]

> "If Gemini's ever unavailable — rate limited, timed out, or the key isn't configured — the product doesn't just break. It falls back to a rules-based version of the same brief, clearly labeled as a fallback, built entirely from CRM data."

---

## System design (~9 min)

[Switch to editor / `docs/ARCHITECTURE.md`]

> "Now the engineering side. I want to cover four things: the architecture, how I handled the AI integration safely, how I thought about testing and quality, and what I'd change for real scale."

### Architecture (2 min)

[Show the flowchart in `docs/ARCHITECTURE.md`]

> "It's a single Next.js modular monolith — App Router pages, server-rendered React, authenticated REST route handlers, and the Gemini calls, all in one deployment. I considered splitting a separate API service, but for one person, one free-tier deploy, and under five requests a second, that would've meant two deploys, duplicated config, and a CORS surface to manage for no real benefit. Everything's still separated by domain internally, so it could be pulled apart later if it needed to.

> Data model: Postgres through Prisma. Leads, follow-ups, users, and two AI-related tables — AIResult for saved outputs and AIRequest for telemetry on every AI call, successful or not. Every single query — leads, follow-ups, AI results — is scoped by `ownerId`. Route protection alone is never treated as the authorization boundary; the query itself enforces it."

[Show `src/app/api/leads/[id]/route.ts`]

> "You can see that here — the `ownerId` filter is baked into the Prisma call, not just checked earlier in the request."

### AI safety (3 min)

[Show `src/lib/ai/context.ts`, `src/lib/ai/schemas.ts`, `src/lib/ai/gemini.ts`]

> "For the AI integration specifically, there are five things I cared about. One — field minimization: the context builder strips PII per use case before it's ever assembled into a prompt. Two — structured output: I request a JSON Schema from Gemini and re-validate everything server-side with Zod regardless of what Gemini claims to have returned. Three — resilience: a 12-second timeout, one bounded retry with jitter on transient and rate-limit failures, and every outcome — success, timeout, blocked, invalid response — gets classified and logged with duration and retry count, without logging prompt content. Four — a database-backed rate limit, five requests a minute per user, that works correctly across serverless instances since it's not in-memory. Five — deterministic fallbacks for all three use cases, so the product stays usable with zero AI budget."

[Show `AIRequest` rows if convenient, or the daily-brief route's fallback branch]

> "And for the daily brief specifically, any lead ID Gemini references that isn't real or doesn't belong to this user gets rejected before it's ever saved."

### Quality and honesty about gaps (2 min)

> "On testing: domain logic and the AI contract layer — schemas, context building, resilience classification, fallbacks — are unit tested at over 95% branch coverage, which was a deliberate choice to put testing effort where a bug would be silent and costly, like a follow-up bucket miscategorizing as not-overdue. I'll be upfront about the gap: routes, pages, and components don't have automated tests — they're verified by manual QA against the live deployment instead. Writing a real route and component test suite would've been the single highest-leverage next investment, and I'd rather say that directly than claim a coverage number that isn't true. I did run Lighthouse against the login page — 99 performance, 100 on the other three categories — but I couldn't get authenticated pages through the CLI without cookie support, so those are inferred from shared architecture, not measured."

### What I'd change for scale (2 min)

[Show the multi-tenancy section of `DECISIONS.md`]

> "If this needed to support many companies and higher traffic: add a tenant and membership model with tenant ID on every index, enforce it through a repository layer plus Postgres row-level security as defense in depth, move AI generation onto a queue with client-visible status instead of a blocking request, add read replicas or materialized dashboard aggregates, and wire up real observability — traces, logs, and AI quality/cost metrics — plus prompt versioning and regression evals so a model or prompt change doesn't silently degrade output quality. I'd only split services once there was measured scaling pressure or a team-ownership reason to, not preemptively."

---

## Close (10s)

> "That's Vaada — thanks for watching. Everything's live at the URL in the submission, and the repo has the full spec, decisions, and architecture docs if you want to go deeper on any of this."

---

## If you need a short cut (under ~7 minutes)

Use just the product walkthrough (sections 1–6 above) plus a compressed 60-second version of "System design," hitting only: single Next.js monolith reason, owner-scoped queries, and the AI safety five-point list read fast without the file tour. Skip the "what I'd change for scale" section entirely — it's the first thing to cut under time pressure, and it's still fully written out in `DECISIONS.md` for anyone reading rather than watching.

## Files worth having open

- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) — the three diagrams referenced above
- [`src/lib/ai/gemini.ts`](../src/lib/ai/gemini.ts)
- [`src/lib/ai/context.ts`](../src/lib/ai/context.ts)
- [`src/lib/ai/schemas.ts`](../src/lib/ai/schemas.ts)
- [`src/app/api/ai/daily-brief/route.ts`](../src/app/api/ai/daily-brief/route.ts)
- [`src/app/api/leads/[id]/route.ts`](../src/app/api/leads/[id]/route.ts)
- [`prisma/schema.prisma`](../prisma/schema.prisma)
- [`DECISIONS.md`](../DECISIONS.md)

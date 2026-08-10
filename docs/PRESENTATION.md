# Live session run sheet

Part 1 of the live session is 15 minutes that you drive: a product demo of the core flows and every Gemini feature, then system design covering FE/API/DB/Gemini, auth, deploy, monitoring, failure modes, and what you'd scale next. Part 2 is their questions, and that's what [`INTERVIEW_GUIDE.md`](./INTERVIEW_GUIDE.md) is for.

Budget is **6 minutes product, 9 minutes system design**. That is tight. The single most common way this goes wrong is spending 10 minutes on the demo and rushing the design half, which is the half they're actually assessing hardest. Watch the clock at the 6 minute mark and move on even if you haven't shown everything.

---

## Before the call

- Open https://vaada-crm.vercel.app and sign in already, so you're not typing a password on screen.
- Open [`docs/system-design-deck.html`](./system-design-deck.html) in a second browser tab. Arrow keys move between slides. Full-screen it.
- Have the editor open on `src/lib/ai/gemini.ts` in case they want to jump into real code mid-presentation.
- Check https://vaada-crm.vercel.app/api/health returns `status: ok`. If the database is cold the first request can take a second.
- If the demo data looks picked over from a previous run, `npm run db:seed` resets it to one lead per stage with fresh relative dates.

Screen share the browser, not your whole desktop.

---

## Part 1a — Product demo (6 min)

Say what the product is before you click anything: a lead CRM for small Indian sales teams, built around the idea that a missed follow-up costs more than a missing chart. `Vaada` means promise.

**Dashboard (60s).** Start here. The attention queue leads the page, overdue first, then due today, sorted by how late each one is. Point out that you deliberately cut a metrics strip that was re-showing the same counts the queue already showed. Pipeline shape and recent activity are on the right because they're real numbers with nowhere else to live.

**Leads and pipeline (90s).** Show the table, search for one lead, clear it. Switch to the pipeline board and drag a card between stages. Say the line that matters: every one of these queries filters by owner ID in the database, not just behind a route guard. Mention each card also has a stage dropdown so dragging is never the only way to do it.

**Lead detail (60s).** Open a lead. Full contact context and follow-up history. Edit something and save. Call out optimistic concurrency: if someone else changed this lead first, the save returns a conflict instead of silently overwriting them.

**Gemini, both lead-level features (120s).** This is the part they care about most, so give it the time. Generate a lead insight. While it runs, say what's being sent: no phone, no email, no full name, and the deal value goes as a band rather than a number. When it returns, point at the structure. Opportunity, risk, evidence, next action, confidence, caveat. Then generate the WhatsApp draft, edit a word in it, and say plainly that nothing in this product sends a message or changes a lead on the model's say-so.

**Follow-ups and daily brief (90s).** Complete an overdue follow-up and note that it only stamps a completion time, it doesn't move the lead or message anyone. Then the daily brief. Generate it, dismiss one priority to show it's curatable before saving, and mention every lead it references is checked against the database so an invented ID can't get saved.

If you're at 6 minutes and haven't done the brief, skip it and say "there's a third Gemini feature, a daily brief, I'll come back to it if there's time." Then move.

---

## Part 1b — System design (9 min)

Switch to the deck. Fifteen slides, so roughly 35 seconds each, but they're not evenly weighted. Time blocks that work:

**Architecture and auth (2 min, slides 1-3).** One Next.js app: pages, API routes, and the Gemini calls in one deploy. Say why you didn't split a backend out, because at this size it's two deploys and a CORS surface for no gain, and the modules are separated by domain so it can be pulled apart later. Then the auth slide: credentials, bcrypt compare, signed HttpOnly JWT session. Be first to say what you'd change, which is OIDC or verified magic links plus MFA and session revocation.

**Data model and authorization (1.5 min, slides 4-5).** Two AI tables and why they're separate: one stores results a user chose to keep, the other logs every call including failures and doubles as the rate limiter's counter. Then the owner-scoping slide. This is your strongest slide. The `ownerId` filter is inside the query, and `updatedAt` is in the where clause so a stale write returns 409 rather than clobbering someone.

**Gemini (3 min, slides 6-9).** The biggest block, and correctly so. Context minimization is a boundary in code, not an instruction in a prompt. Every response is validated against a Zod schema server-side regardless of what the model claims it returned. Then the two guards before any call goes out, five per minute counted in Postgres so it survives serverless. Then failure classification and why only timeouts, 5xx, and rate limits get the one retry.

**Failure modes (1 min, slides 10-11).** Fallbacks built from CRM data, and the test that holds them to the same schema a real response must satisfy, which is why the UI can't tell them apart.

**Deploy and monitoring (1 min, slide 12).** One Vercel deploy, one Neon database, deployable migrations, public health endpoint, GitHub Actions hitting it every five minutes with public run history, structured JSON logs.

**Quality and scale (1.5 min, slides 13-15).** Say the coverage numbers yourself before they ask. 95.4% branch coverage on domain and AI logic, and 6.34% globally because routes and components have no unit tests. Then the scale slide: tenant model with row-level security, queue the AI work, Redis for limits, real tracing. End on the line that splitting into services comes last and only when something measured says so.

---

## If you're running long

Cut in this order, and say you're skipping rather than silently dropping it:

1. The daily brief in the product half. It's the least surprising of the three Gemini features.
2. The fallback test slide (11). The fallback slide before it already makes the point.
3. The data model slide (4). You can fold the two-AI-tables point into the monitoring slide.

Do not cut owner scoping, the Gemini block, or the honesty slide. Those are the three that earn the most.

---

## If the live demo breaks

`vaada-demo.mp4` is a captioned 7-minute recording of both halves. Its first 3.5 minutes are the product walkthrough. If the deployment is down or Gemini is rate limited mid-call, say so plainly, switch to the recording for the product half, and carry on with the deck for the design half. Being calm about a failing dependency in front of them is not a bad look, especially for a project whose whole AI layer is built around graceful degradation. You can even point that out.

If Gemini specifically fails during the demo, that's an opportunity rather than a problem. The fallback UI is a designed behaviour, so let it happen and narrate it.

---

## Handing into Part 2

Close on something that invites the deep dive, along the lines of: happy to go deeper on any of it, the trade-offs are all written up in DECISIONS.md including the parts I didn't finish.

Then read [`INTERVIEW_GUIDE.md`](./INTERVIEW_GUIDE.md), especially section 10, which has the likely questions with answers. The two you should be able to answer without hesitating are the coverage gap and what happens end to end when someone clicks Generate insight.

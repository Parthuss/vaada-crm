# Vaada SmartLead CRM specification

## Title and Metadata

- **Author:** Take-home candidate
- **Date:** 5 August 2026
- **Status:** Approved
- **Approval basis:** QRYX assignment brief plus user authorization to proceed end-to-end
- **Reviewers:** Candidate; QRYX reviewers at submission
- **Target submission:** 8 August 2026

## Context

Small Indian sales teams often manage leads and promised callbacks across spreadsheets, calls, and WhatsApp. Missed follow-ups are more damaging than a lack of decorative analytics: the product must show what needs attention now, preserve lead context, and keep the user in control of every action.

Vaada is a responsive, authenticated CRM built as a TypeScript modular monolith. It includes a status pipeline, follow-ups, an attention-led dashboard, three server-side Gemini workflows, health monitoring, structured logs, free-tier deployment configuration, and submission documentation.

The implementation is optimized for a one-person take-home and a hypothetical team of up to five engineers, per-PR deployment, no monthly infrastructure budget, fewer than five requests per second at p99, and business contact data classified as PII. These assumptions favor Next.js plus PostgreSQL over microservices or a separately deployed SPA/API.

## Functional Requirements

- FR-1: The system MUST authenticate a seeded demo user with email and password and MUST protect all CRM routes and data APIs.
- FR-2: The system MUST scope every lead, follow-up, and saved AI result to the authenticated owner.
- FR-3: A user MUST be able to create, read, update, search, filter, and archive leads.
- FR-4: Each lead MUST have one pipeline status from `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `WON`, or `LOST`.
- FR-5: The leads surface MUST offer an accessible table view and a pipeline board view using the same source data.
- FR-6: A user MUST be able to schedule, edit, complete, and delete a follow-up linked to a lead.
- FR-7: The system MUST classify incomplete follow-ups as upcoming, due today, or overdue in the configured business timezone (`Asia/Kolkata`).
- FR-8: The dashboard MUST prioritize overdue and due-today follow-ups, then show pipeline condition and recent lead momentum.
- FR-9: Completing a follow-up MUST preserve its completion timestamp and MUST NOT implicitly send a message or modify the lead status.
- FR-10: The backend MUST provide a lead-insight Gemini workflow returning structured opportunity, risk, evidence, next action, and confidence fields.
- FR-11: The backend MUST provide an editable WhatsApp/message-draft Gemini workflow returning structured channel, tone, draft, CTA, and safety-note fields.
- FR-12: The backend MUST provide a daily-sales-brief Gemini workflow returning structured summary, priorities, risks, and wins.
- FR-13: All Gemini calls MUST execute on the server; the browser bundle and API responses MUST NOT expose `GEMINI_API_KEY`.
- FR-14: Gemini prompts MUST separate stable system instructions from explicit user/business context and MUST minimize PII.
- FR-15: Gemini responses MUST be parsed as JSON and validated against server-side schemas before they reach the UI.
- FR-16: AI requests MUST have a finite timeout, bounded retry behavior for transient failures, rate limiting, structured logs, and a user-visible fallback.
- FR-17: AI drafts MUST remain editable and MUST require an explicit user action before being copied or saved.
- FR-18: A user MAY save the latest validated AI result for a lead; saving MUST include use-case, model, timestamp, and schema version.
- FR-19: The system MUST expose public `GET /health` and `GET /api/health` endpoints suitable for an uptime monitor.
- FR-20: The repository MUST include an environment template, seed data, deployment configuration, monitoring instructions, README, DECISIONS, architecture diagram, and demo script.

## Non-Functional Requirements

- **NFR-1 Security:** Passwords MUST be hashed; secrets MUST exist only in environment variables; authenticated data access MUST include owner scoping; logs MUST redact credentials, API keys, email addresses, and phone numbers.
- **NFR-2 Privacy:** Gemini context MUST exclude phone, email, full address, and unrelated notes. Contact first name MAY be sent only when needed for a message draft. Notes MUST be truncated and control characters removed.
- **NFR-3 Reliability:** Non-AI API targets are p50 <=100 ms, p95 <=300 ms, and p99 <=800 ms under warm local conditions. AI calls MUST time out at 12 seconds and retry at most once only for `408`, `429`, or `5xx` failures.
- **NFR-4 Availability:** The target service-level objective is 99.5% monthly availability. `/api/health` MUST return within two seconds and report application and database status without leaking configuration.
- **NFR-5 Accessibility:** Primary workflows MUST meet WCAG 2.2 AA, including keyboard operation, visible focus, semantic labels, 4.5:1 normal-text contrast, 3:1 control contrast, non-color status cues, and 44px coarse-pointer targets.
- **NFR-6 Performance:** At p75 on mobile 4G, target LCP <=2.5 s, INP <=200 ms, and CLS <=0.1. Initial route JavaScript SHOULD remain <=200 KB gzip and lazily loaded route chunks <=80 KB gzip where practical.
- **NFR-7 Compatibility:** The app MUST support the latest stable Chrome, Edge, Firefox, and Safari and responsive widths from 320px to 1920px.
- **NFR-8 Observability:** Each API request SHOULD receive a request ID. AI logs MUST include use case, duration, result category, retry count, and model without prompt content or PII.
- **NFR-9 Quality:** TypeScript MUST use strict mode. Critical domain and AI validation modules MUST achieve at least 80% branch coverage; global line coverage MUST be at least 60%.
- **NFR-10 Deployment:** The production topology MUST run on free tiers with one web deployment and one PostgreSQL service; deployments MUST complete in <=15 minutes under normal provider conditions.

## Acceptance Criteria

### AC-1: Seeded credentials authenticate safely (FR-1, NFR-1)
Given the seeded demo account, when valid credentials are submitted, then the user reaches `/dashboard`; when the password is wrong, then the response is generic and no session is created.

### AC-2: Protected data is owner scoped (FR-1, FR-2)
Given an unauthenticated request to a CRM route or protected API, when it is evaluated, then the user is redirected to sign-in or receives `401`; given another owner’s identifier, then no record is returned or modified.

### AC-3: Leads validate and persist (FR-3, FR-4)
Given valid lead fields, when a lead is created and later edited, then persisted values and status are returned; invalid email, phone, value, or status receives field-level validation.

### AC-4: Lead search and filters are accurate (FR-3)
Given leads with different names, companies, statuses, and sources, when search and filters are applied, then only matching owner-scoped results appear and archived leads are excluded by default.

### AC-5: Table and board share data (FR-5)
Given the same lead dataset, when switching between Table and Board, then lead identities and statuses remain consistent; every board action has a keyboard-accessible alternative.

### AC-6: Follow-up buckets use business time (FR-6, FR-7)
Given follow-ups before, on, and after today in `Asia/Kolkata`, when classification runs, then incomplete items are labeled upcoming, due today, or overdue correctly at day boundaries.

### AC-7: Completion preserves history (FR-6, FR-9)
Given an incomplete follow-up, when it is completed, then `completedAt` is stored, the item leaves the attention queue, and lead status remains unchanged.

### AC-8: Dashboard prioritizes attention (FR-8)
Given overdue, due-today, and upcoming work, when the dashboard loads, then overdue items appear first, due-today second, and upcoming items do not displace either group.

### AC-9: Lead insight is structured (FR-10, FR-15)
Given a lead with sufficient context, when insight generation succeeds, then the response validates against the insight schema and shows opportunity, risk, evidence, next action, and confidence.

### AC-10: Message drafts remain user controlled (FR-11, FR-15, FR-17)
Given a lead and selected tone, when a message draft succeeds, then the returned draft validates, remains editable, and is neither sent nor saved until the user explicitly acts.

### AC-11: Daily brief is actionable (FR-12, FR-15)
Given owner-scoped dashboard aggregates, when daily brief generation succeeds, then priorities reference actionable due/overdue work and the response validates against the daily-brief schema.

### AC-12: Server secrets never reach clients (FR-13, NFR-1)
Given a production build and HTTP responses, when files and payloads are scanned, then no Gemini key or server secret appears in client assets, logs, or JSON.

### AC-13: AI context minimizes PII (FR-14, NFR-2)
Given a lead containing phone, email, and notes, when AI context is constructed, then phone/email/full address are absent, allowed notes are sanitized and truncated, and only the message-draft use case may include first name.

### AC-14: AI failures degrade safely (FR-16, NFR-3)
Given a timeout, quota response, malformed JSON, blocked response, or upstream outage, when AI generation runs, then it terminates within the configured bound, logs a redacted category, and returns a useful fallback without breaking the page.

### AC-15: AI rate limiting is enforced (FR-16)
Given more than five AI requests by one user within one minute, when the next request arrives, then it receives `429` and a retry-after hint without calling Gemini.

### AC-16: Only validated AI results are saved (FR-18)
Given a validated AI response, when the user chooses Save, then the latest result is stored with use case, model, schema version, and timestamp; invalid model output is never stored.

### AC-17: Health reports dependency state safely (FR-19, NFR-4)
Given a healthy database, when `/api/health` is called without authentication, then it returns `200` with `status: "ok"`; given a failed database probe, then it returns `503` with `status: "degraded"` and no secret details.

### AC-18: Core flows are accessible and responsive (NFR-5, NFR-7)
Given keyboard-only use at desktop and touch use at 320px width, when login, lead creation, follow-up completion, and each AI workflow are exercised, then all controls remain operable, labeled, visible, and unobscured.

### AC-19: Quality gates pass (NFR-6, NFR-9)
Given the production build and test suite, when CI runs, then typecheck, lint, unit/integration tests, coverage thresholds, and build pass; Lighthouse targets are documented and any free-tier cold-start deviation is identified.

### AC-20: A reviewer can reproduce the submission (FR-20, NFR-10)
Given a fresh reviewer, when README instructions and demo credentials are followed, then the app runs locally and the documentation identifies live URL, environment variables, monitoring proof location, architecture, trade-offs, and demo flow.

## Edge Cases

- EC-1: A lead with no follow-ups appears in the lead views with a clear “Schedule follow-up” action but not in today’s queue.
- EC-2: A follow-up scheduled exactly at midnight is classified using `Asia/Kolkata`, not the server’s UTC date.
- EC-3: An archived lead retains history but is omitted from default lists; its incomplete follow-ups are excluded from the dashboard.
- EC-4: Two updates using a stale `updatedAt` value return `409 CONFLICT` rather than silently overwriting newer data.
- EC-5: Empty lead and dashboard states explain the value and provide a direct create action.
- EC-6: Gemini returns syntactically valid JSON with invalid fields; validation rejects it and the UI receives the standard fallback.
- EC-7: Gemini returns `429`, `503`, a safety block, or no candidate; each maps to a stable internal category without exposing upstream details.
- EC-8: The database is unavailable during `/api/health`; the endpoint returns degraded status without throwing an HTML error page.
- EC-9: Extremely long company names, notes, and AI drafts wrap or truncate without horizontal page overflow; the full accessible value remains available.
- EC-10: Reduced-motion users receive no transform-based entrance choreography.
- EC-11: A user opens the app at a daylight boundary while it remains mounted; the next refresh recalculates follow-up buckets.
- EC-12: Missing `GEMINI_API_KEY` disables AI actions with a clear configuration message while core CRM workflows continue to function.

## API Contracts

```ts
type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";
type FollowUpKind = "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "OTHER";
type AiUseCase = "LEAD_INSIGHT" | "MESSAGE_DRAFT" | "DAILY_BRIEF";

interface ApiError {
  error: { code: string; message: string; fieldErrors?: Record<string, string[]>; requestId: string };
}

interface LeadInput {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  city?: string;
  industry?: string;
  source?: string;
  valuePaise?: number;
  status: LeadStatus;
  notes?: string;
}

interface FollowUpInput {
  leadId: string;
  kind: FollowUpKind;
  dueAt: string;
  note: string;
}

interface LeadInsight {
  opportunity: string;
  risk: string;
  evidence: string[];
  recommendedNextAction: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  caveat: string;
}

interface MessageDraft {
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  tone: "CONCISE" | "WARM" | "FORMAL";
  draft: string;
  callToAction: string;
  safetyNote: string;
}

interface DailyBrief {
  summary: string;
  priorities: Array<{ leadId: string; company: string; reason: string; action: string }>;
  risks: string[];
  wins: string[];
}

// GET /api/leads?query=&status=&view=&page= -> { data: Lead[]; pageInfo: ... }
// POST /api/leads LeadInput -> 201 { data: Lead }
// GET/PATCH/DELETE /api/leads/:id -> { data: Lead } | 204
// GET /api/follow-ups?bucket=overdue|today|upcoming -> { data: FollowUp[] }
// POST /api/follow-ups FollowUpInput -> 201 { data: FollowUp }
// PATCH/DELETE /api/follow-ups/:id -> { data: FollowUp } | 204
// POST /api/follow-ups/:id/complete -> { data: FollowUp }
// GET /api/dashboard -> { attention: ...; pipeline: ...; momentum: ... }
// POST /api/ai/lead-insight { leadId: string } -> { data: LeadInsight; meta: AiMeta }
// POST /api/ai/message-draft { leadId: string; tone: MessageDraft["tone"]; goal: string } -> { data: MessageDraft; meta: AiMeta }
// POST /api/ai/daily-brief {} -> { data: DailyBrief; meta: AiMeta }
// POST /api/ai/results { leadId?: string; useCase: AiUseCase; result: unknown; model: string; schemaVersion: 1 } -> 201
// GET /api/health -> 200 { status: "ok" } | 503 { status: "degraded" }
```

All protected endpoints return `401` when unauthenticated, `404` for missing or other-owner records, `409` for stale writes, `422` for validation failures, `429` for AI rate limits, and `500` only with the generic `ApiError` envelope.

## Data Models

### User

| Field | Type | Constraints |
| --- | --- | --- |
| id | UUID/string | Primary key |
| name | string | 1–80 characters |
| email | string | Unique, normalized |
| passwordHash | string | Required; never returned |
| timezone | string | Defaults to `Asia/Kolkata` |
| createdAt / updatedAt | timestamp | Managed |

### Lead

| Field | Type | Constraints |
| --- | --- | --- |
| id | UUID/string | Primary key |
| ownerId | string | Required FK to User; indexed |
| name / company | string | Required; 1–120 characters |
| email / phone | string? | Validated; optional PII |
| city / industry / source | string? | <=80 characters |
| valuePaise | integer? | >=0 |
| status | LeadStatus | Required; indexed |
| notes | string? | <=2000 characters |
| archivedAt | timestamp? | Soft archive |
| createdAt / updatedAt | timestamp | Managed; `updatedAt` used for optimistic concurrency |

### FollowUp

| Field | Type | Constraints |
| --- | --- | --- |
| id | UUID/string | Primary key |
| ownerId / leadId | string | Required FKs; indexed |
| kind | FollowUpKind | Required |
| dueAt | timestamp | Required; indexed |
| note | string | 1–500 characters |
| completedAt | timestamp? | Null until complete |
| createdAt / updatedAt | timestamp | Managed |

### AIResult

| Field | Type | Constraints |
| --- | --- | --- |
| id | UUID/string | Primary key |
| ownerId | string | Required FK; indexed |
| leadId | string? | Optional FK; owner checked |
| useCase | AiUseCase | Required |
| model | string | Required |
| schemaVersion | integer | `1` for this spec |
| result | JSON | Validated before persistence |
| createdAt | timestamp | Managed |

### AIRequest

| Field | Type | Constraints |
| --- | --- | --- |
| id | UUID/string | Primary key |
| ownerId | string | Required FK; indexed with `createdAt` |
| useCase | AiUseCase | Required |
| resultCategory | string | `STARTED`, `SUCCESS`, `RATE_LIMITED`, or redacted failure category |
| durationMs / retryCount | integer? | Operational metadata only |
| createdAt | timestamp | Managed; used for distributed rate limiting |

## Out of Scope

- OS-1: WhatsApp Cloud API or automatic message sending; drafts are copied or saved only.
- OS-2: Payments, paid APIs, Kubernetes, queues, Redis, microservices, or event sourcing.
- OS-3: Native mobile apps; responsive web is included.
- OS-4: Full team administration, invitations, RBAC, and multi-tenant organizations. Owner scoping establishes a migration path but the submission is single-user-per-account.
- OS-5: Bulk CSV import/export, email synchronization, calendar synchronization, or notification delivery.
- OS-6: Predictive model training, vector databases, RAG, web search, or autonomous lead changes.
- OS-7: Real production SLAs or paid observability; the submission provides free-tier monitoring and documented upgrade paths.

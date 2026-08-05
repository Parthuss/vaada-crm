# Vaada decisions

## Product direction

**Vaada** means a promise or commitment. That idea shapes both the product and visual system: the dashboard prioritizes commitments that are late or due today, and the circular check mark represents a completed promise. The interface is practical, trustworthy, and quietly intelligent—not a generic analytics template.

## Architecture

### Next.js modular monolith

I chose one Next.js deployment for UI, server rendering, authenticated REST routes, and Gemini calls. A split Vite SPA plus standalone API would create two free-tier deploys, duplicate configuration, and add CORS/network failure modes without helping this traffic profile. Modules remain separated by domain so the API can be extracted later.

### PostgreSQL + Prisma

CRM records are relational and benefit from foreign keys, transactions, owner-scoped indexes, and JSONB only where AI outputs vary by use case. Postgres also makes the AI rate limit shared across serverless instances. Prisma provides generated types and deployable migrations; the explicit PostgreSQL driver adapter fits Prisma 7.

### JWT session + credentials

JWT sessions avoid a session table for the demo while passwords are hashed with bcrypt. Every query still includes `ownerId`; route protection alone is never treated as authorization. For production I would use OIDC or verified magic links and add recovery, MFA, session revocation, and audit events.

## AI approach

The three use cases intentionally have different inputs and contracts:

| Use case | Context sent | Structured result | Human control |
| --- | --- | --- | --- |
| Lead insight | Stage, value band, industry/city/source, sanitized notes, recent commitments | Opportunity, risk, evidence, next action, confidence, caveat | User chooses whether to save |
| Message draft | Above plus first name, channel, tone, goal | Editable draft, CTA, safety note | Never sent automatically |
| Daily brief | Up to 30 active leads; no names, phone, or email | Summary, ranked real lead IDs, risks, wins | User opens leads and may save brief |

The backend passes system rules separately from untrusted context, requests JSON Schema output, validates with Zod, rejects unknown lead IDs, times out, retries one transient failure, classifies errors, and provides deterministic fallbacks. Five requests per user per rolling minute is deliberately conservative for the free tier.

### Trade-offs

- A database count is simpler and globally correct at this scale but less efficient than Redis sliding-window limits at high traffic.
- `Promise`/SDK timeouts bound the client experience, though upstream work can still consume provider quota; a queue and cancellation-aware transport would improve this.
- AI results are optional snapshots, not a conversation memory. This reduces hidden context and cost but means users regenerate after lead changes.
- Notes are sanitized and truncated, not semantically redacted. Production should add configurable PII detection/redaction and tenant retention policies.

## Design choices

Research across Mobbin patterns, Dribbble CRM explorations, and Awwwards' Aqtos case study led to an attention-led dashboard, scan-friendly pipeline, dense but calm tables, and action-oriented AI surfaces. Inter Variable is self-hosted. Semantic color is constrained: coral means overdue/error, amber means due today, evergreen carries trust/action, and all statuses include text rather than color alone.

The implementation targets WCAG 2.2 AA with persistent labels, keyboard-visible focus, semantic tables, labelled icon buttons, status text, responsive reflow, and reduced-motion support.

## Higher traffic and multi-tenancy

1. Add `Tenant`, `Membership`, and role/permission models; move every uniqueness rule and compound index under `tenantId`.
2. Enforce tenant context in a repository layer and PostgreSQL Row Level Security as defense in depth.
3. Move AI work to a queue, stream status to the client, cache identical briefs, and rate-limit through managed Redis.
4. Add read replicas/materialized dashboard aggregates and cursor pagination.
5. Send traces, logs, and AI quality/cost metrics to OpenTelemetry/Sentry; add prompt versioning and regression evals.
6. Split services only after measured scaling or team-ownership pressure justifies the operational cost.

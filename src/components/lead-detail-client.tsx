"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Check,
  Save,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { formatDateTime, formatInr, formatStatus } from "@/lib/format";
import { classifyFollowUp } from "@/lib/domain/follow-ups";
import { LEAD_STATUSES } from "@/lib/domain/lead-status";

type FollowUp = {
  id: string;
  kind: string;
  dueAt: string;
  note: string;
  completedAt: string | null;
};
type Lead = {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  industry: string | null;
  source: string | null;
  valuePaise: number | null;
  status: string;
  notes: string | null;
  updatedAt: string;
  followUps: FollowUp[];
};
type Insight = {
  opportunity: string;
  risk: string;
  evidence: string[];
  recommendedNextAction: string;
  confidence: string;
  caveat: string;
};
type Draft = {
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  tone: "CONCISE" | "WARM" | "FORMAL";
  draft: string;
  callToAction: string;
  safetyNote: string;
};
type AiOrigin = { source: "gemini" | "fallback"; model?: string };
const statuses = LEAD_STATUSES;

export function LeadDetailClient({ initialLead }: { initialLead: Lead }) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [aiLoading, setAiLoading] = useState<"insight" | "draft" | "">("");
  const [insight, setInsight] = useState<Insight | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [insightOrigin, setInsightOrigin] = useState<AiOrigin | null>(null);
  const [draftOrigin, setDraftOrigin] = useState<AiOrigin | null>(null);
  const [insightSaving, setInsightSaving] = useState(false);
  const [insightSaveMessage, setInsightSaveMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaveMessage, setDraftSaveMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [warning, setWarning] = useState("");
  async function saveLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    const data: Record<string, FormDataEntryValue | null> = Object.fromEntries(new FormData(event.currentTarget));
    const rupees = String(data.valueRupees ?? "").trim();
    data.valuePaise = rupees ? String(Math.round(Number(rupees) * 100)) : null;
    delete data.valueRupees;
    data.updatedAt = lead.updatedAt;
    try {
    const response = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      setSaveMessage({ text: payload?.error?.message ?? "Could not save changes.", error: true });
    else {
      setLead((current) => ({ ...current, ...payload.data }));
      setSaveMessage({ text: "Changes saved.", error: false });
      router.refresh();
    }
    } catch {
      setSaveMessage({ text: "Connection lost. Check your network and try again.", error: true });
    } finally {
      setSaving(false);
    }
  }
  async function runInsight() {
    setAiLoading("insight");
    setWarning("");
    try {
    const response = await fetch("/api/ai/lead-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    const payload = await response.json().catch(() => null);
    if (response.ok) {
      setInsight(payload.data);
      setInsightOrigin({ source: payload.source, model: payload.model });
      setWarning(payload.warning ?? "");
    } else setWarning(payload?.error?.message ?? "AI could not respond.");
    } catch {
      setWarning("Connection lost. Check your network and try again.");
    } finally { setAiLoading(""); }
  }
  async function runDraft() {
    setAiLoading("draft");
    setWarning("");
    try {
    const response = await fetch("/api/ai/message-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        channel: "WHATSAPP",
        tone: "WARM",
        goal: "Agree on a specific next step",
      }),
    });
    const payload = await response.json().catch(() => null);
    if (response.ok) {
      setDraft(payload.data);
      setDraftOrigin({ source: payload.source, model: payload.model });
      setWarning(payload.warning ?? "");
    } else setWarning(payload?.error?.message ?? "AI could not respond.");
    } catch {
      setWarning("Connection lost. Check your network and try again.");
    } finally { setAiLoading(""); }
  }
  async function saveAi(
    useCase: "LEAD_INSIGHT" | "MESSAGE_DRAFT",
    result: Insight | Draft,
    origin: AiOrigin | null,
  ) {
    const setSaving = useCase === "LEAD_INSIGHT" ? setInsightSaving : setDraftSaving;
    const setSaveResult = useCase === "LEAD_INSIGHT" ? setInsightSaveMessage : setDraftSaveMessage;
    setSaving(true);
    setSaveResult(null);
    try {
    const response = await fetch("/api/ai/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        useCase,
        leadId: lead.id,
        model: origin?.source === "fallback" ? "rules-fallback-v1" : origin?.model ?? "gemini",
        result,
      }),
    });
    setSaveResult(
      response.ok
        ? { text: "Saved to this lead.", error: false }
        : { text: "Could not save the AI result.", error: true },
    );
    } catch {
      setSaveResult({ text: "Connection lost. Check your network and try again.", error: true });
    } finally {
      setSaving(false);
    }
  }
  async function archiveLead() {
    if (
      !window.confirm(
        `Archive ${lead.company}? Its history is retained, but it will leave active views.`,
      )
    )
      return;
    setArchiving(true);
    setArchiveError("");
    try {
    const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/leads");
      router.refresh();
    } else {
      setArchiveError("Could not archive this lead.");
      setArchiving(false);
    }
    } catch {
      setArchiveError("Connection lost. Check your network and try again.");
      setArchiving(false);
    }
  }
  return (
    <div className="page">
      <Link href="/leads" className="text-link">
        <ArrowLeft size={14} style={{ display: "inline" }} /> Back to leads
      </Link>
      <header className="page-head" style={{ marginTop: 24 }}>
        <div>
          <span className="eyebrow">Lead workspace</span>
          <h1>{lead.company}</h1>
          <p className="lede">
            {lead.name} · {lead.city || "Location not set"} ·{" "}
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatInr(lead.valuePaise)}</span>
          </p>
        </div>
        <span className="badge">{formatStatus(lead.status)}</span>
      </header>
      <section className="grid detail-grid">
        <div className="grid">
          <article className="card">
            <header className="card-head">
              <h2>Lead details</h2>
              <button
                type="button"
                className="button danger"
                onClick={archiveLead}
                disabled={archiving}
              >
                <Archive size={14} />
                {archiving ? "Archiving…" : "Archive"}
              </button>
            </header>
            {archiveError && (
              <p className="field-error" role="alert" aria-live="assertive" style={{ padding: "0 24px", margin: "0 0 14px" }}>
                {archiveError}
              </p>
            )}
            <form className="card-body form-grid" onSubmit={saveLead}>
              <div className="field">
                <label htmlFor="name">Contact name *</label>
                <input
                  className="input"
                  id="name"
                  name="name"
                  defaultValue={lead.name}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="company">Company *</label>
                <input
                  className="input"
                  id="company"
                  name="company"
                  defaultValue={lead.company}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  className="input"
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={lead.email ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  className="input"
                  id="phone"
                  name="phone"
                  inputMode="tel"
                  maxLength={20}
                  defaultValue={lead.phone ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  className="input"
                  id="city"
                  name="city"
                  defaultValue={lead.city ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="industry">Industry</label>
                <input
                  className="input"
                  id="industry"
                  name="industry"
                  defaultValue={lead.industry ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="source">Source</label>
                <input
                  className="input"
                  id="source"
                  name="source"
                  defaultValue={lead.source ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="valueRupees">Potential value (₹)</label>
                <input
                  className="input"
                  id="valueRupees"
                  name="valueRupees"
                  type="number"
                  min="0"
                  max="20000000"
                  defaultValue={lead.valuePaise == null ? "" : lead.valuePaise / 100}
                />
              </div>
              <div className="field full">
                <label htmlFor="status">Status</label>
                <select
                  className="input"
                  id="status"
                  name="status"
                  defaultValue={lead.status}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{formatStatus(status)}</option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label htmlFor="notes">Sales notes</label>
                <textarea
                  className="input"
                  id="notes"
                  name="notes"
                  defaultValue={lead.notes ?? ""}
                  maxLength={2000}
                />
              </div>
              {saveMessage && (saveMessage.error ? (
                <p className="field-error full" role="alert" aria-live="assertive">
                  {saveMessage.text}
                </p>
              ) : (
                <p className="notice success full" role="status" aria-live="polite">
                  {saveMessage.text}
                </p>
              ))}
              <div className="dialog-actions full">
                <button className="button" disabled={saving}>
                  <Save size={15} />
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </article>
          <article className="card">
            <header className="card-head">
              <h2>Follow-up history</h2>
              <Link className="text-link" href="/follow-ups">
                Schedule one
              </Link>
            </header>
            <div className="card-body attention-list">
              {lead.followUps.map((item) => {
                const bucket = item.completedAt ? null : classifyFollowUp(new Date(item.dueAt));
                const bucketClass = bucket && bucket !== "UPCOMING" ? ` ${bucket.toLowerCase()}` : "";
                return (
                  <div className="attention-row" key={item.id}>
                    <span className={`dot${item.completedAt ? " done" : bucketClass}`} aria-hidden />
                    <div>
                      <strong>{item.note}</strong>
                      <div className="subtle">{item.kind.toLowerCase()}</div>
                    </div>
                    <span className="hide-mobile">
                      {formatDateTime(item.dueAt)}
                    </span>
                    <span className={`badge${item.completedAt ? "" : bucketClass}`}>
                      {item.completedAt ? "Completed" : bucket === "OVERDUE" ? "Overdue" : bucket === "TODAY" ? "Today" : "Open"}
                    </span>
                  </div>
                );
              })}
              {!lead.followUps.length && (
                <div className="empty">
                  <strong>No follow-ups yet.</strong>Give this conversation a
                  concrete next step.
                </div>
              )}
            </div>
          </article>
        </div>
        <aside className="ai-shell">
          <div className="ai-kicker">
            <Sparkles size={15} />
            Vaada intelligence
          </div>
          <h2 style={{ marginTop: 9 }}>Evidence first. You decide.</h2>
          <p className="lede">
            Gemini works from deliberately limited CRM context. Review and edit
            everything before use.
          </p>
          <div className="grid ai-grid" style={{ marginTop: 20 }}>
            <button
              className="button"
              onClick={runInsight}
              disabled={!!aiLoading}
            >
              <WandSparkles size={15} />
              {aiLoading === "insight" ? "Analysing…" : "Lead insight"}
            </button>
            <button
              className="button secondary"
              onClick={runDraft}
              disabled={!!aiLoading}
            >
              <Sparkles size={15} />
              {aiLoading === "draft" ? "Drafting…" : "WhatsApp draft"}
            </button>
          </div>
          {warning && (
            <p className="notice" role="status" aria-live="polite">
              {warning}
            </p>
          )}
          {insight && (
            <div className="ai-output">
              <span className="eyebrow">
                Lead insight · {insight.confidence} confidence
              </span>
              <h3 style={{ marginTop: 15 }}>Opportunity</h3>
              <p>{insight.opportunity}</p>
              <h3>Risk</h3>
              <p>{insight.risk}</p>
              <h3>Best next action</h3>
              <p>{insight.recommendedNextAction}</p>
              <ul>
                {insight.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="subtle">{insight.caveat}</p>
              <button
                className="button secondary"
                onClick={() => saveAi("LEAD_INSIGHT", insight, insightOrigin)}
                disabled={insightSaving}
              >
                <Check size={14} />
                {insightSaving ? "Saving…" : "Save insight"}
              </button>
              {insightSaveMessage && (insightSaveMessage.error ? (
                <p className="field-error" role="alert" aria-live="assertive">{insightSaveMessage.text}</p>
              ) : (
                <p className="notice success" role="status" aria-live="polite">{insightSaveMessage.text}</p>
              ))}
            </div>
          )}
          {draft && (
            <div className="ai-output">
              <span className="eyebrow">Editable WhatsApp draft</span>
              <textarea
                className="input"
                aria-label="Editable AI message draft"
                value={draft.draft}
                onChange={(event) =>
                  setDraft({ ...draft, draft: event.target.value })
                }
                style={{ marginTop: 14 }}
              />
              <p className="subtle">{draft.safetyNote}</p>
              <button
                className="button secondary"
                onClick={() => saveAi("MESSAGE_DRAFT", draft, draftOrigin)}
                disabled={draftSaving}
              >
                <Check size={14} />
                {draftSaving ? "Saving…" : "Save draft"}
              </button>
              {draftSaveMessage && (draftSaveMessage.error ? (
                <p className="field-error" role="alert" aria-live="assertive">{draftSaveMessage.text}</p>
              ) : (
                <p className="notice success" role="status" aria-live="polite">{draftSaveMessage.text}</p>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

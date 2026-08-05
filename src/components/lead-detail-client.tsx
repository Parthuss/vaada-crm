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
import { formatDateTime, formatInr } from "@/lib/format";

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
const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

export function LeadDetailClient({ initialLead }: { initialLead: Lead }) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [aiLoading, setAiLoading] = useState<"insight" | "draft" | "">("");
  const [insight, setInsight] = useState<Insight | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [warning, setWarning] = useState("");
  async function saveLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.valuePaise = String(Math.round(Number(data.valueRupees || 0) * 100));
    delete data.valueRupees;
    data.updatedAt = lead.updatedAt;
    const response = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok)
      setMessage(payload.error?.message ?? "Could not save changes.");
    else {
      setLead((current) => ({ ...current, ...payload.data }));
      setMessage("Changes saved.");
      router.refresh();
    }
    setSaving(false);
  }
  async function runInsight() {
    setAiLoading("insight");
    setWarning("");
    const response = await fetch("/api/ai/lead-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    const payload = await response.json();
    if (response.ok) {
      setInsight(payload.data);
      setWarning(payload.warning ?? "");
    } else setWarning(payload.error?.message ?? "AI could not respond.");
    setAiLoading("");
  }
  async function runDraft() {
    setAiLoading("draft");
    setWarning("");
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
    const payload = await response.json();
    if (response.ok) {
      setDraft(payload.data);
      setWarning(payload.warning ?? "");
    } else setWarning(payload.error?.message ?? "AI could not respond.");
    setAiLoading("");
  }
  async function saveAi(
    useCase: "LEAD_INSIGHT" | "MESSAGE_DRAFT",
    result: Insight | Draft,
  ) {
    const response = await fetch("/api/ai/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        useCase,
        leadId: lead.id,
        model: warning ? "rules-fallback-v1" : "gemini-2.5-flash",
        result,
      }),
    });
    setMessage(
      response.ok
        ? "AI result saved to this lead."
        : "Could not save the AI result.",
    );
  }
  async function archiveLead() {
    if (
      !window.confirm(
        `Archive ${lead.company}? Its history is retained, but it will leave active views.`,
      )
    )
      return;
    const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/leads");
      router.refresh();
    } else setMessage("Could not archive this lead.");
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
            {formatInr(lead.valuePaise)}
          </p>
        </div>
        <span className="badge">{lead.status}</span>
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
              >
                <Archive size={14} />
                Archive
              </button>
            </header>
            <form className="card-body form-grid" onSubmit={saveLead}>
              <div className="field">
                <label htmlFor="name">Contact name</label>
                <input
                  className="input"
                  id="name"
                  name="name"
                  defaultValue={lead.name}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="company">Company</label>
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
                  defaultValue={(lead.valuePaise ?? 0) / 100}
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
                    <option key={status}>{status}</option>
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
              {message && (
                <p
                  className={
                    message.includes("saved")
                      ? "notice full"
                      : "field-error full"
                  }
                  role="status"
                >
                  {message}
                </p>
              )}
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
              {lead.followUps.map((item) => (
                <div className="attention-row" key={item.id}>
                  <span
                    className="dot"
                    style={{
                      background: item.completedAt
                        ? "var(--primary)"
                        : "var(--amber)",
                    }}
                  />
                  <div>
                    <strong>{item.note}</strong>
                    <div className="subtle">{item.kind.toLowerCase()}</div>
                  </div>
                  <span className="hide-mobile">
                    {formatDateTime(item.dueAt)}
                  </span>
                  <span className="badge">
                    {item.completedAt ? "Completed" : "Open"}
                  </span>
                </div>
              ))}
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
            <p className="notice" role="status">
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
                onClick={() => saveAi("LEAD_INSIGHT", insight)}
              >
                <Check size={14} />
                Save insight
              </button>
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
                onClick={() => saveAi("MESSAGE_DRAFT", draft)}
              >
                <Check size={14} />
                Save draft
              </button>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

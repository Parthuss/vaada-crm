"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Sparkles, WandSparkles, X } from "lucide-react";

type Brief = { summary: string; priorities: Array<{ leadId: string; company: string; reason: string; action: string }>; risks: string[]; wins: string[] };

export function DailyBrief({ initialBrief, initialSaved }: { initialBrief: Brief | null; initialSaved: boolean }) {
  const [brief, setBrief] = useState<Brief | null>(initialBrief);
  const [pending, setPending] = useState(false);
  const [warning, setWarning] = useState("");
  const [saved, setSaved] = useState(initialSaved);

  async function generate() {
    setPending(true);
    setWarning("");
    setSaved(false);
    const response = await fetch("/api/ai/daily-brief", { method: "POST" });
    const payload = await response.json();
    if (response.ok) {
      setBrief(payload.data);
      setWarning(payload.warning ?? "");
    } else {
      setWarning(payload.error?.message ?? "The brief could not be generated.");
    }
    setPending(false);
  }

  async function save() {
    if (!brief) return;
    const response = await fetch("/api/ai/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useCase: "DAILY_BRIEF", model: warning ? "rules-fallback-v1" : "gemini-3.5-flash-lite", result: brief }),
    });
    setSaved(response.ok);
  }

  function updateSummary(summary: string) {
    setBrief((current) => (current ? { ...current, summary } : current));
    setSaved(false);
  }
  function dismissPriority(index: number) {
    setBrief((current) => (current ? { ...current, priorities: current.priorities.filter((_, i) => i !== index) } : current));
    setSaved(false);
  }
  function dismissRisk(index: number) {
    setBrief((current) => (current ? { ...current, risks: current.risks.filter((_, i) => i !== index) } : current));
    setSaved(false);
  }
  function dismissWin(index: number) {
    setBrief((current) => (current ? { ...current, wins: current.wins.filter((_, i) => i !== index) } : current));
    setSaved(false);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Gemini sales copilot</span>
          <h1>Your day, made clearer.</h1>
          <p className="lede">A structured brief grounded in pipeline facts—not invented certainty.</p>
        </div>
        <button className="button" onClick={generate} disabled={pending}>
          <WandSparkles size={16} />
          {pending ? "Building brief…" : brief ? "Refresh brief" : "Create today’s brief"}
        </button>
      </header>
      <section className="ai-shell">
        <div className="ai-kicker">
          <Sparkles size={15} />
          Daily sales brief
        </div>
        {!brief && (
          <div className="empty">
            <strong>Ready when you are.</strong>
            Vaada will rank current priorities, flag risks, and surface progress. Only necessary CRM context is sent to Gemini.
          </div>
        )}
        {warning && <p className="notice" role="status">{warning}</p>}
        {brief && (
          <div className="ai-output">
            <textarea className="ai-summary" aria-label="Edit brief summary" value={brief.summary} onChange={(event) => updateSummary(event.target.value)} />
            <div className="divider" />
            <div className="grid ai-grid">
              <section>
                <h3>Priority conversations</h3>
                <div className="attention-list">
                  {brief.priorities.map((item, index) => (
                    <div className="attention-row" style={{ gridTemplateColumns: "28px 1fr auto auto" }} key={`${item.leadId}-${index}`}>
                      <span className="badge">{index + 1}</span>
                      <div>
                        <strong>{item.company}</strong>
                        <div className="subtle">{item.reason}</div>
                        <p style={{ margin: "8px 0 0", fontSize: 13 }}>{item.action}</p>
                      </div>
                      <Link href={`/leads/${item.leadId}`} className="icon-button" aria-label={`View ${item.company}`}>
                        <ArrowRight size={15} />
                      </Link>
                      <button type="button" className="icon-button" aria-label={`Dismiss ${item.company} from this brief`} onClick={() => dismissPriority(index)}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  {!brief.priorities.length && <p className="subtle">No priorities left — everything here has been reviewed or dismissed.</p>}
                </div>
              </section>
              <section>
                <h3>Risks to watch</h3>
                <ul>
                  {brief.risks.map((item, index) => (
                    <li key={`${item}-${index}`}>
                      <span>{item}</span>
                      <button type="button" className="icon-button" aria-label="Dismiss this risk" onClick={() => dismissRisk(index)}>
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
                <h3 style={{ marginTop: 24 }}>Momentum</h3>
                <ul>
                  {brief.wins.map((item, index) => (
                    <li key={`${item}-${index}`}>
                      <span>{item}</span>
                      <button type="button" className="icon-button" aria-label="Dismiss this note" onClick={() => dismissWin(index)}>
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="dialog-actions">
              <button className="button secondary" onClick={save}>
                <Check size={14} />
                {saved ? "Saved" : "Save this brief"}
              </button>
            </div>
          </div>
        )}
      </section>
      <details className="ai-trust">
        <summary>How this brief is built</summary>
        <dl>
          <div>
            <dt>Context sent to Gemini</dt>
            <dd>Only what&apos;s needed to prioritize — no phone numbers or email addresses.</dd>
          </div>
          <div>
            <dt>Response format</dt>
            <dd>Structured and checked; anything with an invalid lead ID is rejected, not shown.</dd>
          </div>
          <div>
            <dt>If Gemini is unavailable</dt>
            <dd>A rules-based attention list is shown instead, clearly labeled.</dd>
          </div>
          <div>
            <dt>Before you save</dt>
            <dd>Edit the summary or dismiss any item — nothing is sent or acted on automatically.</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}

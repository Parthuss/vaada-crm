"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { formatDateTime, formatInr, formatStatus } from "@/lib/format";
import { classifyFollowUp } from "@/lib/domain/follow-ups";
import { LEAD_STATUSES } from "@/lib/domain/lead-status";
import { useDialogA11y } from "@/components/use-dialog-a11y";

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
  followUps: Array<{ dueAt: string }>;
};
const statuses = LEAD_STATUSES;

export function LeadsClient({
  initialLeads,
  openNew,
}: {
  initialLeads: Lead[];
  openNew: boolean;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [dialog, setDialog] = useState(openNew);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const closeDialog = () => {
    setDialog(false);
    setError("");
  };
  const dialogRef = useDialogA11y(dialog, closeDialog);
  const filtered = useMemo(
    () =>
      leads.filter(
        (lead) =>
          (status === "ALL" || lead.status === status) &&
      `${lead.name} ${lead.company} ${lead.source ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [leads, query, status],
  );

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const body: Record<string, FormDataEntryValue | null> = Object.fromEntries(form);
      const rupees = String(form.get("valueRupees") ?? "").trim();
      body.valuePaise = rupees ? String(Math.round(Number(rupees) * 100)) : null;
      delete body.valueRupees;
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error?.message ?? "Could not add this lead.");
        return;
      }
      setLeads((current) => [
        { ...payload.data, updatedAt: payload.data.updatedAt, followUps: [] },
        ...current,
      ]);
      closeDialog();
      router.replace("/leads");
      router.refresh();
    } catch {
      setError("Connection lost. Check your network and try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow">People and opportunities</span>
          <h1>Leads</h1>
          <p className="lede">
            Keep context close and every next step explicit.
          </p>
        </div>
        <button className="button" onClick={() => setDialog(true)}>
          <Plus size={16} />
          Add lead
        </button>
      </header>
      <div className="card">
        <div className="card-head" style={{ gap: 12, flexWrap: "wrap" }}>
          <label style={{ position: "relative", flex: "1 1 260px" }}>
            <span className="sr-only">Search leads</span>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 13,
                top: 14,
                color: "var(--muted)",
              }}
            />
            <input
              className="input"
              type="search"
              name="query"
              style={{ paddingLeft: 39 }}
              placeholder="Search name, company, or source"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            className="input"
            style={{ width: 170 }}
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>{formatStatus(item)}</option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table className="leads-table" role="table">
            <caption className="sr-only">Leads with their status, value, next promise, and last update</caption>
            <thead role="rowgroup">
              <tr role="row">
                <th role="columnheader">Lead</th>
                <th role="columnheader">Status</th>
                <th role="columnheader">Value</th>
                <th role="columnheader">Next promise</th>
                <th role="columnheader">Updated</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {filtered.map((lead) => (
                <tr
                  role="row"
                  key={lead.id}
                  className="row-clickable"
                  onClick={(event) => {
                    // Real <a> children (the name, "Schedule one") keep native link behaviour —
                    // modifier-key and middle-click open-in-new-tab, no double navigation — this
                    // only fires the row's own push when the click landed on inert cell content.
                    if ((event.target as HTMLElement).closest("a")) return;
                    router.push(`/leads/${lead.id}`);
                  }}
                >
                  <td role="cell" data-label="Lead">
                    <Link href={`/leads/${lead.id}`}>
                      <span className="lead-name">{lead.company}</span>
                      <div className="subtle">
                        {lead.name} · {lead.city || "City not set"}
                      </div>
                    </Link>
                  </td>
                  <td role="cell" data-label="Status">
                    <span className="badge">{formatStatus(lead.status)}</span>
                  </td>
                  <td role="cell" data-label="Value">{formatInr(lead.valuePaise)}</td>
                  <td role="cell" data-label="Next promise">
                    {lead.followUps[0] ? (
                      (() => {
                        const bucket = classifyFollowUp(new Date(lead.followUps[0].dueAt));
                        return (
                          <time className={`badge ${bucket.toLowerCase()}`}>
                            {bucket === "OVERDUE" ? "Overdue · " : bucket === "TODAY" ? "Today · " : ""}
                            {formatDateTime(lead.followUps[0].dueAt)}
                          </time>
                        );
                      })()
                    ) : (
                      <Link href={`/leads/${lead.id}`} className="text-link">Schedule one</Link>
                    )}
                  </td>
                  <td role="cell" className="subtle" data-label="Updated">{formatDateTime(lead.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="empty">
              <strong>No leads found.</strong>Try a different filter or add your
              first lead.
            </div>
          )}
        </div>
      </div>
      {dialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div
            className="dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-lead-heading"
          >
            <header className="dialog-head">
              <div>
                <span className="eyebrow">New opportunity</span>
                <h2 id="new-lead-heading">Add a lead</h2>
              </div>
              <button
                className="button secondary"
                style={{ padding: 0, width: 44 }}
                aria-label="Close"
                onClick={closeDialog}
              >
                <X size={17} />
              </button>
            </header>
            <form onSubmit={createLead} className="form-grid">
              <div className="field">
                <label htmlFor="name">Contact name *</label>
                <input
                  className="input"
                  id="name"
                  name="name"
                  required
                  maxLength={120}
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="company">Company *</label>
                <input
                  className="input"
                  id="company"
                  name="company"
                  required
                  maxLength={120}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  className="input"
                  id="phone"
                  name="phone"
                  inputMode="tel"
                  maxLength={20}
                />
              </div>
              <div className="field">
                <label htmlFor="city">City</label>
                <input className="input" id="city" name="city" />
              </div>
              <div className="field">
                <label htmlFor="industry">Industry</label>
                <input className="input" id="industry" name="industry" />
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
                  step="1"
                />
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <select className="input" id="status" name="status">
                  {statuses.map((item) => (
                    <option key={item} value={item}>{formatStatus(item)}</option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label htmlFor="source">Source</label>
                <input
                  className="input"
                  id="source"
                  name="source"
                  placeholder="Referral, website, event…"
                />
              </div>
              <div className="field full">
                <label htmlFor="notes">Notes</label>
                <textarea
                  className="input"
                  id="notes"
                  name="notes"
                  maxLength={2000}
                  placeholder="Only add context the team genuinely needs."
                />
              </div>
              {error && (
                <p className="field-error full" role="alert" aria-live="assertive">
                  {error}
                </p>
              )}
              <div className="dialog-actions full">
                <button
                  type="button"
                  className="button secondary"
                  onClick={closeDialog}
                >
                  Cancel
                </button>
                <button className="button" disabled={pending}>
                  {pending ? "Adding…" : "Add lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

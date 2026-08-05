"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { formatDateTime } from "@/lib/format";
import { useDialogA11y } from "@/components/use-dialog-a11y";

type Item = {
  id: string;
  leadId: string;
  kind: string;
  dueAt: string;
  note: string;
  completedAt: string | null;
  bucket: string;
  lead: { id: string; name: string; company: string };
};
type Lead = { id: string; name: string; company: string };
const kinds = ["CALL", "WHATSAPP", "EMAIL", "MEETING", "OTHER"];
const dateInputValue = (value: string) =>
  formatInTimeZone(new Date(value), "Asia/Kolkata", "yyyy-MM-dd'T'HH:mm");
const bucketFor = (value: string) => {
  const due = formatInTimeZone(new Date(value), "Asia/Kolkata", "yyyy-MM-dd");
  const today = formatInTimeZone(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
  return due < today ? "OVERDUE" : due === today ? "TODAY" : "UPCOMING";
};

export function FollowUpsClient({
  initialItems,
  leads,
}: {
  initialItems: Item[];
  leads: Lead[];
}) {
  const [items, setItems] = useState(initialItems);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const closeDialog = () => {
    setDialog(false);
    setEditing(null);
    setError("");
  };
  const dialogRef = useDialogA11y(dialog, closeDialog);
  async function complete(id: string) {
    setPending(id);
    setError("");
    try {
      const response = await fetch(`/api/follow-ups/${id}/complete`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error?.message ?? "Could not complete this follow-up.");
        return;
      }
      setItems((current) => current.map((item) => item.id === id ? { ...item, completedAt: new Date().toISOString(), bucket: "COMPLETED" } : item));
    } catch {
      setError("Connection lost. Check your network and try again.");
    } finally {
      setPending("");
    }
  }
  async function saveFollowUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("create");
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const body = Object.fromEntries(form);
      const response = await fetch(editing ? `/api/follow-ups/${editing.id}` : "/api/follow-ups", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error?.message ?? "Could not schedule the follow-up.");
        return;
      }
      const lead = leads.find((item) => item.id === payload.data.leadId);
      if (!lead) {
        setError("The selected lead is no longer available. Refresh and try again.");
        return;
      }
      const prepared = { ...payload.data, dueAt: payload.data.dueAt, completedAt: null, bucket: bucketFor(payload.data.dueAt), lead };
      setItems((current) => editing ? current.map((item) => (item.id === editing.id ? prepared : item)) : [prepared, ...current]);
      closeDialog();
    } catch {
      setError("Connection lost. Check your network and try again.");
    } finally {
      setPending("");
    }
  }
  async function remove(item: Item) {
    if (!window.confirm(`Delete this follow-up for ${item.lead.company}?`))
      return;
    setPending(item.id);
    try {
      const response = await fetch(`/api/follow-ups/${item.id}`, { method: "DELETE" });
      if (response.ok) setItems((current) => current.filter((entry) => entry.id !== item.id));
      else setError("Could not delete this follow-up.");
    } catch {
      setError("Connection lost. Check your network and try again.");
    } finally {
      setPending("");
    }
  }
  const open = items.filter((item) => !item.completedAt);
  const done = items.filter((item) => item.completedAt);
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Commitments</span>
          <h1>Follow-ups</h1>
          <p className="lede">
            Due dates turn good intentions into kept promises.
          </p>
        </div>
        <button
          className="button"
          onClick={() => {
            setEditing(null);
            setDialog(true);
          }}
          disabled={!leads.length}
        >
          <Plus size={16} />
          Schedule follow-up
        </button>
      </header>
      {error && !dialog && <p className="field-error" role="alert" aria-live="assertive">{error}</p>}
      <section className="card">
        <header className="card-head">
          <h2>Open</h2>
          <span className="badge">{open.length}</span>
        </header>
        <div className="card-body attention-list">
          {open.map((item) => (
            <div className="attention-row" key={item.id}>
              <span className={`dot ${item.bucket.toLowerCase()}`} aria-hidden="true" />
              <div>
                <Link href={`/leads/${item.lead.id}`}>
                  <strong>{item.lead.company}</strong>
                </Link>
                <div className="subtle">
                  {item.kind.toLowerCase()} · {item.lead.name}
                </div>
              </div>
              <span className="hide-mobile">{item.note}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <time className={`badge ${item.bucket.toLowerCase()}`}>
                  {formatDateTime(item.dueAt)}
                </time>
                <button
                  className="button secondary"
                  style={{ width: 40, padding: 0 }}
                  aria-label={`Complete follow-up for ${item.lead.company}`}
                  disabled={pending === item.id}
                  onClick={() => complete(item.id)}
                >
                  <Check size={16} />
                </button>
                <button
                  className="button secondary"
                  style={{ width: 40, padding: 0 }}
                  aria-label={`Edit follow-up for ${item.lead.company}`}
                  onClick={() => {
                    setEditing(item);
                    setDialog(true);
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="button danger"
                  style={{ width: 40, padding: 0 }}
                  aria-label={`Delete follow-up for ${item.lead.company}`}
                  disabled={pending === item.id}
                  onClick={() => remove(item)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!open.length && (
            <div className="empty">
              <strong>Nothing pending.</strong>Schedule a clear next step from a
              lead.
            </div>
          )}
        </div>
      </section>
      {!!done.length && (
        <section className="card" style={{ marginTop: 20 }}>
          <header className="card-head">
            <h2>Recently completed</h2>
          </header>
          <div className="card-body attention-list">
            {done.slice(0, 8).map((item) => (
              <div className="attention-row" key={item.id}>
                <span
                  className="dot"
                  style={{ background: "var(--primary)" }}
                  aria-hidden="true"
                />
                <div>
                  <strong>{item.lead.company}</strong>
                  <div className="subtle">{item.lead.name}</div>
                </div>
                <span className="hide-mobile">{item.note}</span>
                <span className="badge">Completed</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {dialog && (
        <div
          className="dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div
            className="dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="followup-heading"
          >
            <header className="dialog-head">
              <div>
                <span className="eyebrow">Keep the next promise</span>
                <h2 id="followup-heading">
                  {editing ? "Edit follow-up" : "Schedule follow-up"}
                </h2>
              </div>
              <button
                className="button secondary"
                style={{ padding: 0, width: 42 }}
                aria-label="Close"
                onClick={closeDialog}
              >
                <X size={17} />
              </button>
            </header>
            <form className="form-grid" onSubmit={saveFollowUp}>
              <div className="field full">
                <label htmlFor="leadId">Lead</label>
                <select
                  id="leadId"
                  name="leadId"
                  className="input"
                  required
                  autoFocus
                  defaultValue={editing?.leadId}
                >
                  {leads.map((lead) => (
                    <option value={lead.id} key={lead.id}>
                      {lead.company} · {lead.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="kind">Type</label>
                <select
                  id="kind"
                  name="kind"
                  className="input"
                  defaultValue={editing?.kind}
                >
                  {kinds.map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="dueAt">Due date and time</label>
                <input
                  id="dueAt"
                  name="dueAt"
                  className="input"
                  type="datetime-local"
                  required
                  defaultValue={editing ? dateInputValue(editing.dueAt) : ""}
                />
              </div>
              <div className="field full">
                <label htmlFor="note">Promised next step</label>
                <textarea
                  id="note"
                  name="note"
                  className="input"
                  required
                  maxLength={500}
                  defaultValue={editing?.note}
                  placeholder="Send revised estimate and confirm Friday review"
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
                <button className="button" disabled={pending === "create"}>
                  {pending === "create"
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

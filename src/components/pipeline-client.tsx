"use client";

import Link from "next/link";
import { useState } from "react";
import { formatInr, formatStatus } from "@/lib/format";
import { LEAD_STATUSES } from "@/lib/domain/lead-status";

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
};

const stages = LEAD_STATUSES;

export function PipelineClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  async function moveLead(lead: Lead, nextStatus: string) {
    if (lead.status === nextStatus) return;
    const previous = leads;
    setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status: nextStatus } : item)));
    setPendingId(lead.id);
    setError("");
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          company: lead.company,
          email: lead.email ?? "",
          phone: lead.phone ?? "",
          city: lead.city ?? "",
          industry: lead.industry ?? "",
          source: lead.source ?? "",
          valuePaise: lead.valuePaise,
          status: nextStatus,
          notes: lead.notes ?? "",
          updatedAt: lead.updatedAt,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setLeads(previous);
        setError(payload?.error?.message ?? "Could not move this lead.");
        return;
      }
      setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ...payload.data } : item)));
      setAnnouncement(`Moved ${lead.company} to ${formatStatus(nextStatus)}.`);
    } catch {
      setLeads(previous);
      setError("Connection lost. Check your network and try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      {error && (
        <p className="field-error" role="alert" aria-live="assertive" style={{ marginBottom: 16 }}>
          {error}
        </p>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <section className="pipeline" aria-label="Lead pipeline">
        {stages.map((stage) => {
          const items = leads.filter((lead) => lead.status === stage);
          const draggingLead = draggingId ? leads.find((lead) => lead.id === draggingId) : undefined;
          const isDropTarget = dragOverStage === stage && !!draggingLead && draggingLead.status !== stage;
          return (
            <article
              key={stage}
              className={`lane${isDropTarget ? " drag-over" : ""}`}
              onDragOver={(event) => {
                if (!draggingId) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverStage(stage);
              }}
              onDragLeave={(event) => {
                const next = event.relatedTarget;
                if (next instanceof Node && event.currentTarget.contains(next)) return;
                setDragOverStage((current) => (current === stage ? null : current));
              }}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/plain") || draggingId;
                const lead = leads.find((item) => item.id === id);
                setDragOverStage(null);
                setDraggingId(null);
                if (lead) moveLead(lead, stage);
              }}
            >
              <header className="lane-head">
                <h2>{formatStatus(stage)}</h2>
                <span className="badge">{items.length}</span>
              </header>
              {items.length ? (
                items.map((lead) => (
                  <div
                    key={lead.id}
                    className={`lane-card${draggingId === lead.id ? " dragging" : ""}`}
                    draggable
                    aria-roledescription="draggable card"
                    onDragStart={(event) => {
                      setDraggingId(lead.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", lead.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverStage(null);
                    }}
                  >
                    <Link href={`/leads/${lead.id}`} className="lane-card-body">
                      <strong>{lead.company}</strong>
                      <span>{lead.name}</span>
                      <span>{formatInr(lead.valuePaise)}</span>
                    </Link>
                    <label className="lane-card-move">
                      <span className="sr-only">Move {lead.company} to a different stage</span>
                      <select
                        value={lead.status}
                        disabled={pendingId === lead.id}
                        onChange={(event) => moveLead(lead, event.target.value)}
                      >
                        {stages.map((option) => (
                          <option key={option} value={option}>
                            {formatStatus(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))
              ) : (
                <p className="lane-empty">No leads here yet.</p>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}

import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { db } from "@/lib/db";
import { classifyFollowUp, sortAttentionItems } from "@/lib/domain/follow-ups";
import { LEAD_STATUSES, isClosedStatus } from "@/lib/domain/lead-status";
import { formatDateTime, formatInr, formatStatus } from "@/lib/format";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerId = await requireUserId();
  const [leads, followUps, recentlyKept] = await Promise.all([
    db.lead.findMany({ where: { ownerId, archivedAt: null }, select: { status: true, valuePaise: true } }),
    db.followUp.findMany({ where: { ownerId, completedAt: null, lead: { archivedAt: null } }, include: { lead: { select: { id: true, name: true, company: true } } }, orderBy: { dueAt: "asc" } }),
    db.followUp.findMany({ where: { ownerId, completedAt: { not: null }, lead: { archivedAt: null } }, include: { lead: { select: { id: true, company: true } } }, orderBy: { completedAt: "desc" }, take: 5 }),
  ]);
  const attention = sortAttentionItems(followUps).map((item) => ({ ...item, bucket: classifyFollowUp(item.dueAt) }));
  const activeLeads = leads.filter((lead) => !isClosedStatus(lead.status));
  const pipeline = activeLeads.reduce((sum, lead) => sum + (lead.valuePaise ?? 0), 0);
  const stages = LEAD_STATUSES;
  const maximum = Math.max(1, ...stages.map((status) => leads.filter((lead) => lead.status === status).length));
  const todayLabel = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return <div className="page">
    <header className="page-head"><div><span className="eyebrow">{todayLabel}</span><h1>Promises that need you.</h1><p className="lede">Start with what is late, then protect today’s commitments.</p></div><Link href="/leads?new=1" className="button"><Plus size={16} />Add lead</Link></header>
    <section className="grid dashboard-grid">
      <article className="card"><header className="card-head"><h2>Attention queue</h2><Link className="text-link" href="/follow-ups">View all <ArrowRight size={13} style={{ display: "inline" }} /></Link></header><div className="card-body attention-list">
        {attention.length ? attention.slice(0, 8).map((item) => <Link href={`/leads/${item.lead.id}`} className="attention-row" key={item.id}><span className={`dot ${item.bucket.toLowerCase()}`} aria-hidden /><div><strong>{item.lead.company}</strong><div className="subtle">{item.lead.name}</div>{item.note && <div className="subtle">{item.note}</div>}</div><time className={`badge ${item.bucket.toLowerCase()}`}>{item.bucket === "OVERDUE" ? "Overdue · " : item.bucket === "TODAY" ? "Today · " : ""}{formatDateTime(item.dueAt)}</time></Link>) : <div className="empty"><strong>No open promises.</strong>Add a follow-up from any lead to build your daily queue.</div>}
      </div></article>
      <div className="grid">
        <article className="card"><header className="card-head"><div><h2>Pipeline shape</h2><p className="card-meta">{activeLeads.length} active leads · {formatInr(pipeline, true)} open</p></div><Link className="text-link" href="/pipeline">Open board</Link></header><div className="card-body status-stack">{stages.map((status) => { const count = leads.filter((lead) => lead.status === status).length; return <div className="status-line" key={status}><span>{formatStatus(status)}</span><div className="bar"><i style={{ width: `${count / maximum * 100}%` }} /></div><strong>{count}</strong></div>; })}</div></article>
        <article className="card"><header className="card-head"><h2>Recent activity</h2></header><div className="card-body attention-list">
          {recentlyKept.length ? recentlyKept.map((item) => <div className="attention-row" key={item.id}><span className="dot done" aria-hidden /><div><strong>{item.lead.company}</strong><div className="subtle">{item.note}</div></div><time className="subtle" dateTime={item.completedAt!.toISOString()}>{formatDistanceToNow(item.completedAt!, { addSuffix: true })}</time></div>) : <div className="empty"><strong>Nothing completed yet.</strong>Kept promises will show up here.</div>}
        </div></article>
      </div>
    </section>
  </div>;
}

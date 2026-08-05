import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { classifyFollowUp } from "@/lib/domain/follow-ups";
import { formatDateTime, formatInr, formatStatus } from "@/lib/format";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerId = await requireUserId();
  const [leads, followUps] = await Promise.all([
    db.lead.findMany({ where: { ownerId, archivedAt: null }, select: { status: true, valuePaise: true } }),
    db.followUp.findMany({ where: { ownerId, completedAt: null, lead: { archivedAt: null } }, include: { lead: { select: { id: true, name: true, company: true } } }, orderBy: { dueAt: "asc" } }),
  ]);
  const attention = followUps.map((item) => ({ ...item, bucket: classifyFollowUp(item.dueAt) }));
  const dueToday = attention.filter((item) => item.bucket === "TODAY").length;
  const overdue = attention.filter((item) => item.bucket === "OVERDUE").length;
  const pipeline = leads.filter((lead) => !["WON", "LOST"].includes(lead.status)).reduce((sum, lead) => sum + (lead.valuePaise ?? 0), 0);
  const stages = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];
  const maximum = Math.max(1, ...stages.map((status) => leads.filter((lead) => lead.status === status).length));
  const todayLabel = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return <div className="page">
    <header className="page-head"><div><span className="eyebrow">{todayLabel}</span><h1>Promises that need you.</h1><p className="lede">Start with what is late, then protect today’s commitments.</p></div><Link href="/leads?new=1" className="button"><Plus size={16} />Add lead</Link></header>
    <section className="grid dashboard-grid">
      <article className="card"><header className="card-head"><h2>Attention queue</h2><Link className="text-link" href="/follow-ups">View all <ArrowRight size={13} style={{ display: "inline" }} /></Link></header><div className="card-body attention-list">
        {attention.length ? attention.slice(0, 8).map((item) => <Link href={`/leads/${item.lead.id}`} className="attention-row" key={item.id}><span className={`dot ${item.bucket.toLowerCase()}`} aria-hidden /><div><strong>{item.lead.company}</strong><div className="subtle">{item.lead.name}</div></div><span className="hide-mobile">{item.note}</span><time className={`badge ${item.bucket.toLowerCase()}`}>{item.bucket === "OVERDUE" ? "Overdue · " : item.bucket === "TODAY" ? "Today · " : ""}{formatDateTime(item.dueAt)}</time></Link>) : <div className="empty"><strong>No open promises.</strong>Add a follow-up from any lead to build your daily queue.</div>}
      </div></article>
      <article className="card"><header className="card-head"><h2>Pipeline shape</h2><Link className="text-link" href="/pipeline">Open board</Link></header><div className="card-body status-stack">{stages.map((status) => { const count = leads.filter((lead) => lead.status === status).length; return <div className="status-line" key={status}><span>{formatStatus(status)}</span><div className="bar"><i style={{ width: `${count / maximum * 100}%` }} /></div><strong>{count}</strong></div>; })}</div></article>
    </section>
    <section className="grid metrics" aria-label="Sales overview">
      <article className={`metric ${overdue ? "alert" : ""}`}><span>Overdue promises</span><strong>{overdue}</strong><small>{overdue ? "Needs attention now" : "All caught up"}</small></article>
      <article className="metric promise"><span>Due today</span><strong>{dueToday}</strong><small>Keep today’s word</small></article>
      <article className="metric"><span>Active leads</span><strong>{leads.filter((lead) => !["WON", "LOST"].includes(lead.status)).length}</strong><small>{leads.length} leads total</small></article>
      <article className="metric"><span>Open pipeline</span><strong>{formatInr(pipeline, true)}</strong><small>Across active stages</small></article>
    </section>
  </div>;
}

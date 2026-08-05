import Link from "next/link";
import { db } from "@/lib/db";
import { formatInr, formatStatus } from "@/lib/format";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
const stages = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;

export default async function PipelinePage() {
  const ownerId = await requireUserId();
  const leads = await db.lead.findMany({ where: { ownerId, archivedAt: null }, orderBy: { updatedAt: "desc" } });
  return <div className="page" style={{ maxWidth: "none" }}><header className="page-head"><div><span className="eyebrow">Status pipeline</span><h1>Every conversation, in motion.</h1><p className="lede">A scan-friendly view of where each opportunity stands.</p></div></header>
    <section className="pipeline" aria-label="Lead pipeline">{stages.map((stage) => { const items = leads.filter((lead) => lead.status === stage); return <article className="lane" key={stage}><header className="lane-head"><h2>{formatStatus(stage)}</h2><span className="badge">{items.length}</span></header>{items.length ? items.map((lead) => <Link href={`/leads/${lead.id}`} className="lane-card" key={lead.id}><strong>{lead.company}</strong><span>{lead.name}</span><span>{formatInr(lead.valuePaise)}</span></Link>) : <p className="lane-empty">No leads here yet.</p>}</article>; })}</section>
  </div>;
}

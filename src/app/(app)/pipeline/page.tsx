import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { PipelineClient } from "@/components/pipeline-client";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const ownerId = await requireUserId();
  const leads = await db.lead.findMany({ where: { ownerId, archivedAt: null }, orderBy: { updatedAt: "desc" } });
  return <div className="page" style={{ maxWidth: "none" }}><header className="page-head"><div><span className="eyebrow">Status pipeline</span><h1>Every conversation, in motion.</h1><p className="lede">Drag a card, or use its stage field, to move it.</p></div></header>
    <PipelineClient initialLeads={JSON.parse(JSON.stringify(leads))} />
  </div>;
}

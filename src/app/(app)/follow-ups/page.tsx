import { FollowUpsClient } from "@/components/follow-ups-client";
import { db } from "@/lib/db";
import { classifyFollowUp } from "@/lib/domain/follow-ups";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const ownerId = await requireUserId();
  const [items, leads] = await Promise.all([
    db.followUp.findMany({ where: { ownerId, lead: { archivedAt: null } }, include: { lead: { select: { id: true, name: true, company: true } } }, orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }] }),
    db.lead.findMany({ where: { ownerId, archivedAt: null }, select: { id: true, name: true, company: true }, orderBy: { company: "asc" } }),
  ]);
  const prepared = items.map((item) => ({ ...item, bucket: item.completedAt ? "COMPLETED" : classifyFollowUp(item.dueAt) }));
  return <FollowUpsClient initialItems={JSON.parse(JSON.stringify(prepared))} leads={leads} />;
}

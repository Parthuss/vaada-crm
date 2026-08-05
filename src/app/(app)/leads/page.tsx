import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { LeadsClient } from "@/components/leads-client";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const ownerId = await requireUserId();
  const leads = await db.lead.findMany({ where: { ownerId, archivedAt: null }, include: { followUps: { where: { completedAt: null }, orderBy: { dueAt: "asc" }, take: 1 } }, orderBy: { updatedAt: "desc" } });
  const params = await searchParams;
  return <LeadsClient initialLeads={JSON.parse(JSON.stringify(leads))} openNew={params.new === "1"} />;
}

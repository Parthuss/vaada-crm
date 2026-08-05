import { notFound } from "next/navigation";
import { LeadDetailClient } from "@/components/lead-detail-client";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const ownerId = await requireUserId(); const { id } = await params;
  const lead = await db.lead.findFirst({ where: { id, ownerId, archivedAt: null }, include: { followUps: { orderBy: { dueAt: "desc" } }, aiResults: { orderBy: { createdAt: "desc" }, take: 5 } } });
  if (!lead) notFound();
  return <LeadDetailClient initialLead={JSON.parse(JSON.stringify(lead))} />;
}

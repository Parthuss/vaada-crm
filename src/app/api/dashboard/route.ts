import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { classifyFollowUp, sortAttentionItems } from "@/lib/domain/follow-ups";
import { LEAD_STATUSES, isClosedStatus } from "@/lib/domain/lead-status";
import { requireUserId } from "@/lib/session";

export async function GET() {
  try {
    const ownerId = await requireUserId();
    const [leads, followUps] = await Promise.all([
      db.lead.findMany({ where: { ownerId, archivedAt: null }, select: { id: true, status: true, valuePaise: true } }),
      db.followUp.findMany({ where: { ownerId, completedAt: null, lead: { archivedAt: null } }, include: { lead: { select: { id: true, name: true, company: true, status: true } } }, orderBy: { dueAt: "asc" } }),
    ]);
    const attention = sortAttentionItems(followUps).map((item) => ({ ...item, bucket: classifyFollowUp(item.dueAt) }));
    return Response.json({ data: { counts: { leads: leads.length, dueToday: attention.filter((item) => item.bucket === "TODAY").length, overdue: attention.filter((item) => item.bucket === "OVERDUE").length, pipelineValuePaise: leads.filter((lead) => !isClosedStatus(lead.status)).reduce((sum, lead) => sum + (lead.valuePaise ?? 0), 0) }, statusCounts: Object.fromEntries(LEAD_STATUSES.map((status) => [status, leads.filter((lead) => lead.status === status).length])), attention: attention.slice(0, 8) } });
  } catch (error) { return apiError(error); }
}

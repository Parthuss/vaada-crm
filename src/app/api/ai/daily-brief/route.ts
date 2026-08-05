import { apiError } from "@/lib/api";
import { buildLeadContext } from "@/lib/ai/context";
import { dailyBriefFallback } from "@/lib/ai/fallbacks";
import { generateStructured } from "@/lib/ai/gemini";
import { dailyBriefSchema } from "@/lib/ai/schemas";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function POST() {
  try {
    const ownerId = await requireUserId();
    const leads = await db.lead.findMany({ where: { ownerId, archivedAt: null, status: { notIn: ["WON", "LOST"] } }, include: { followUps: { orderBy: { dueAt: "asc" }, take: 6 } }, orderBy: { updatedAt: "desc" }, take: 30 });
    if (!leads.length) return Response.json({ data: dailyBriefFallback([]), source: "fallback", warning: "You have no active leads yet. Add a lead to get a prioritised brief." });
    const context = leads.map(buildLeadContext);
    try {
      const result = await generateStructured({ ownerId, useCase: "DAILY_BRIEF", context, instruction: "Create today's sales brief. Prioritize at most six leads using overdue commitments, pipeline value, and stage. Lead IDs must come exactly from context.", schema: dailyBriefSchema });
      const allowed = new Set(leads.map((lead) => lead.id));
      if (result.data.priorities.some((item) => !allowed.has(item.leadId))) throw new Error("INVALID_RESPONSE_LEAD_ID");
      return Response.json({ ...result, source: "gemini" });
    } catch (error) {
      if (error instanceof Error && error.message === "AI_RATE_LIMIT") return apiError(error);
      return Response.json({ data: dailyBriefFallback(leads), source: "fallback", warning: "Gemini is unavailable. Showing a rules-based attention list." });
    }
  } catch (error) { return apiError(error); }
}

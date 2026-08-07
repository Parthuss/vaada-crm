import { z } from "zod";
import { apiError } from "@/lib/api";
import { buildLeadContext } from "@/lib/ai/context";
import { leadInsightFallback } from "@/lib/ai/fallbacks";
import { AiGenerationError, generateStructured } from "@/lib/ai/gemini";
import { leadInsightSchema } from "@/lib/ai/schemas";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const inputSchema = z.object({ leadId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const { leadId } = inputSchema.parse(await request.json());
    const lead = await db.lead.findFirst({ where: { id: leadId, ownerId, archivedAt: null }, include: { followUps: { orderBy: { dueAt: "desc" }, take: 6 } } });
    if (!lead) throw new Error("NOT_FOUND");
    try {
      const result = await generateStructured({ ownerId, useCase: "LEAD_INSIGHT", context: buildLeadContext(lead), instruction: "Assess this lead. Explain one opportunity, one risk, the CRM evidence, and the single best next action.", schema: leadInsightSchema });
      return Response.json({ ...result, source: "gemini" });
    } catch (error) {
      if (error instanceof Error && error.message === "AI_RATE_LIMIT") return apiError(error);
      const warning = error instanceof AiGenerationError && error.message === "GEMINI_NOT_CONFIGURED"
        ? "AI isn't configured for this deployment. Showing a safe CRM-based fallback."
        : "Gemini is unavailable. Showing a safe CRM-based fallback.";
      return Response.json({ data: leadInsightFallback(lead), source: "fallback", warning });
    }
  } catch (error) { return apiError(error); }
}

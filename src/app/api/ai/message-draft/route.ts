import { z } from "zod";
import { apiError } from "@/lib/api";
import { buildMessageContext } from "@/lib/ai/context";
import { messageFallback } from "@/lib/ai/fallbacks";
import { generateStructured } from "@/lib/ai/gemini";
import { messageDraftSchema } from "@/lib/ai/schemas";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const inputSchema = z.object({ leadId: z.string().min(1), channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]).default("WHATSAPP"), tone: z.enum(["CONCISE", "WARM", "FORMAL"]).default("WARM"), goal: z.string().trim().max(240).default("Agree on the next step") });

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const input = inputSchema.parse(await request.json());
    const lead = await db.lead.findFirst({ where: { id: input.leadId, ownerId, archivedAt: null }, include: { followUps: { orderBy: { dueAt: "desc" }, take: 6 } } });
    if (!lead) throw new Error("NOT_FOUND");
    try {
      const result = await generateStructured({ ownerId, useCase: "MESSAGE_DRAFT", context: { ...buildMessageContext(lead), channel: input.channel, tone: input.tone, goal: input.goal }, instruction: "Draft a short customer follow-up in the requested channel and tone. Avoid invented commitments. Include a clear, low-pressure call to action.", schema: messageDraftSchema });
      return Response.json({ ...result, source: "gemini" });
    } catch (error) {
      if (error instanceof Error && error.message === "AI_RATE_LIMIT") return apiError(error);
      return Response.json({ data: messageFallback(lead, input.channel), source: "fallback", warning: "Gemini is unavailable. Showing an editable template." });
    }
  } catch (error) { return apiError(error); }
}

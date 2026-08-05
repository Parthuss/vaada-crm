import { z } from "zod";
import { apiError } from "@/lib/api";
import { dailyBriefSchema, leadInsightSchema, messageDraftSchema } from "@/lib/ai/schemas";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const inputSchema = z.discriminatedUnion("useCase", [
  z.object({ useCase: z.literal("LEAD_INSIGHT"), leadId: z.string(), model: z.string().max(80), result: leadInsightSchema }),
  z.object({ useCase: z.literal("MESSAGE_DRAFT"), leadId: z.string(), model: z.string().max(80), result: messageDraftSchema }),
  z.object({ useCase: z.literal("DAILY_BRIEF"), leadId: z.null().optional(), model: z.string().max(80), result: dailyBriefSchema }),
]);

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const input = inputSchema.parse(await request.json());
    if (input.leadId) {
      const exists = await db.lead.count({ where: { id: input.leadId, ownerId, archivedAt: null } });
      if (!exists) throw new Error("NOT_FOUND");
    }
    if (input.useCase === "DAILY_BRIEF") {
      const referenced = [...new Set(input.result.priorities.map((item) => item.leadId))];
      if (referenced.length) {
        const owned = await db.lead.count({ where: { id: { in: referenced }, ownerId, archivedAt: null } });
        if (owned !== referenced.length) throw new Error("NOT_FOUND");
      }
    }
    const saved = await db.aIResult.create({ data: { ownerId, leadId: input.leadId ?? null, useCase: input.useCase, model: input.model, result: input.result } });
    return Response.json({ data: saved }, { status: 201 });
  } catch (error) { return apiError(error); }
}

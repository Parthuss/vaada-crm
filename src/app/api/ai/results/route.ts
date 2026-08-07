import { z } from "zod";
import { apiError } from "@/lib/api";
import { dailyBriefSchema, leadInsightSchema, messageDraftSchema } from "@/lib/ai/schemas";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

// schemaVersion defaults to the only version this API currently understands (see AIResult.schemaVersion in
// prisma/schema.prisma) so existing clients don't need to send it, but a future incompatible client sending
// anything other than 1 is rejected rather than silently persisted as if it were validated against this shape.
const schemaVersion = z.literal(1).default(1);

const inputSchema = z.discriminatedUnion("useCase", [
  z.object({ useCase: z.literal("LEAD_INSIGHT"), leadId: z.string(), model: z.string().max(80), schemaVersion, result: leadInsightSchema }),
  z.object({ useCase: z.literal("MESSAGE_DRAFT"), leadId: z.string(), model: z.string().max(80), schemaVersion, result: messageDraftSchema }),
  z.object({ useCase: z.literal("DAILY_BRIEF"), leadId: z.null().optional(), model: z.string().max(80), schemaVersion, result: dailyBriefSchema }),
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

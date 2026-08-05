import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { followUpInputSchema } from "@/lib/domain/schemas";
import { requireUserId } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ownerId = await requireUserId();
    const { id } = await params;
    const input = followUpInputSchema.parse(await request.json());
    const lead = await db.lead.count({ where: { id: input.leadId, ownerId, archivedAt: null } });
    if (!lead) throw new Error("NOT_FOUND");
    const result = await db.followUp.updateMany({ where: { id, ownerId }, data: input });
    if (!result.count) throw new Error("NOT_FOUND");
    return Response.json({ data: await db.followUp.findUnique({ where: { id } }) });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ownerId = await requireUserId();
    const { id } = await params;
    const result = await db.followUp.deleteMany({ where: { id, ownerId } });
    if (!result.count) throw new Error("NOT_FOUND");
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}

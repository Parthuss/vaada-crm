import { apiError, cleanOptional } from "@/lib/api";
import { db } from "@/lib/db";
import { leadInputSchema } from "@/lib/domain/schemas";
import { requireUserId } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  try {
    const ownerId = await requireUserId();
    const { id } = await params;
    const lead = await db.lead.findFirst({ where: { id, ownerId, archivedAt: null }, include: { followUps: { orderBy: { dueAt: "desc" } }, aiResults: { orderBy: { createdAt: "desc" }, take: 5 } } });
    if (!lead) throw new Error("NOT_FOUND");
    return Response.json({ data: lead });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const ownerId = await requireUserId();
    const { id } = await params;
    const input = leadInputSchema.parse(await request.json());
    const result = await db.lead.updateMany({ where: { id, ownerId, archivedAt: null, ...(input.updatedAt ? { updatedAt: input.updatedAt } : {}) }, data: { name: input.name, company: input.company, email: cleanOptional(input.email), phone: cleanOptional(input.phone), city: cleanOptional(input.city), industry: cleanOptional(input.industry), source: cleanOptional(input.source), valuePaise: input.valuePaise, status: input.status, notes: cleanOptional(input.notes) } });
    if (!result.count) {
      const exists = await db.lead.count({ where: { id, ownerId, archivedAt: null } });
      throw new Error(exists ? "EDIT_CONFLICT" : "NOT_FOUND");
    }
    return Response.json({ data: await db.lead.findUnique({ where: { id } }) });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    const ownerId = await requireUserId();
    const { id } = await params;
    const result = await db.lead.updateMany({ where: { id, ownerId, archivedAt: null }, data: { archivedAt: new Date() } });
    if (!result.count) throw new Error("NOT_FOUND");
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}

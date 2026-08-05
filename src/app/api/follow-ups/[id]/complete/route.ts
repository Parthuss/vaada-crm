import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ownerId = await requireUserId();
    const { id } = await params;
    const result = await db.followUp.updateMany({ where: { id, ownerId, completedAt: null }, data: { completedAt: new Date() } });
    if (!result.count) throw new Error("NOT_FOUND");
    return Response.json({ data: await db.followUp.findUnique({ where: { id } }) });
  } catch (error) { return apiError(error); }
}

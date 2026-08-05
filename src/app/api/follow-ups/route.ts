import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { followUpInputSchema } from "@/lib/domain/schemas";
import { classifyFollowUp } from "@/lib/domain/follow-ups";
import { requireUserId } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const ownerId = await requireUserId();
    const items = await db.followUp.findMany({
      where: { ownerId, lead: { archivedAt: null } },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
            status: true,
            archivedAt: true,
          },
        },
      },
      orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }],
    });
    const bucket = new URL(request.url).searchParams.get("bucket")?.toUpperCase();
    const filtered = bucket
      ? items.filter(
          (item) => !item.completedAt && classifyFollowUp(item.dueAt) === bucket,
        )
      : items;
    return Response.json({ data: filtered });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const input = followUpInputSchema.parse(await request.json());
    const lead = await db.lead.findFirst({
      where: { id: input.leadId, ownerId, archivedAt: null },
      select: { id: true },
    });
    if (!lead) throw new Error("NOT_FOUND");
    const item = await db.followUp.create({ data: { ownerId, ...input } });
    return Response.json({ data: item }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

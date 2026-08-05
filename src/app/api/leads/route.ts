import { apiError, cleanOptional } from "@/lib/api";
import { db } from "@/lib/db";
import { leadInputSchema } from "@/lib/domain/schemas";
import { requireUserId } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const ownerId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const query = searchParams.get("q")?.trim();
    const leads = await db.lead.findMany({
      where: {
        ownerId,
        archivedAt: null,
        ...(status ? { status: status as never } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { company: { contains: query, mode: "insensitive" } },
                { source: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        followUps: {
          where: { completedAt: null },
          orderBy: { dueAt: "asc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return Response.json({ data: leads });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const input = leadInputSchema.parse(await request.json());
    const lead = await db.lead.create({
      data: {
        ownerId,
        name: input.name,
        company: input.company,
        email: cleanOptional(input.email),
        phone: cleanOptional(input.phone),
        city: cleanOptional(input.city),
        industry: cleanOptional(input.industry),
        source: cleanOptional(input.source),
        valuePaise: input.valuePaise,
        status: input.status,
        notes: cleanOptional(input.notes),
      },
    });
    return Response.json({ data: lead }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

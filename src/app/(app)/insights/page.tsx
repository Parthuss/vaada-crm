import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { DailyBrief } from "@/components/daily-brief";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const ownerId = await requireUserId();
  const latest = await db.aIResult.findFirst({ where: { ownerId, useCase: "DAILY_BRIEF" }, orderBy: { createdAt: "desc" } });
  return <DailyBrief initialBrief={latest ? JSON.parse(JSON.stringify(latest.result)) : null} initialSaved={Boolean(latest)} />;
}

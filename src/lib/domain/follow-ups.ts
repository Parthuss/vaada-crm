import { formatInTimeZone } from "date-fns-tz";

export type FollowUpBucket = "OVERDUE" | "TODAY" | "UPCOMING";
const BUSINESS_TIMEZONE = "Asia/Kolkata";

export function classifyFollowUp(dueAt: Date, now = new Date(), timezone = BUSINESS_TIMEZONE): FollowUpBucket {
  const dueDay = formatInTimeZone(dueAt, timezone, "yyyy-MM-dd");
  const today = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  if (dueDay < today) return "OVERDUE";
  if (dueDay === today) return "TODAY";
  return "UPCOMING";
}

export function sortAttentionItems<T extends { dueAt: Date }>(items: T[], now = new Date(), timezone = BUSINESS_TIMEZONE): T[] {
  const order: Record<FollowUpBucket, number> = { OVERDUE: 0, TODAY: 1, UPCOMING: 2 };
  return [...items].sort((a, b) => {
    const bucketDifference = order[classifyFollowUp(a.dueAt, now, timezone)] - order[classifyFollowUp(b.dueAt, now, timezone)];
    return bucketDifference || a.dueAt.getTime() - b.dueAt.getTime();
  });
}

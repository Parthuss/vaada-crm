import { describe, expect, it } from "vitest";
import { classifyFollowUp, sortAttentionItems } from "@/lib/domain/follow-ups";

describe("follow-up business-time classification", () => {
  const now = new Date("2026-08-05T06:30:00.000Z"); // noon in Kolkata

  it("AC-6: classifies yesterday, today, and tomorrow in Asia/Kolkata", () => {
    expect(classifyFollowUp(new Date("2026-08-04T18:29:59.000Z"), now)).toBe("OVERDUE");
    expect(classifyFollowUp(new Date("2026-08-04T18:30:00.000Z"), now)).toBe("TODAY");
    expect(classifyFollowUp(new Date("2026-08-05T18:29:59.000Z"), now)).toBe("TODAY");
    expect(classifyFollowUp(new Date("2026-08-05T18:30:00.000Z"), now)).toBe("UPCOMING");
  });

  it("AC-8: orders overdue before due today before upcoming", () => {
    const items = [
      { id: "future", dueAt: new Date("2026-08-06T06:30:00Z") },
      { id: "today", dueAt: new Date("2026-08-05T08:30:00Z") },
      { id: "late", dueAt: new Date("2026-08-03T08:30:00Z") },
    ];
    expect(sortAttentionItems(items, now).map((item) => item.id)).toEqual(["late", "today", "future"]);
  });

  it("AC-8: breaks ties within the same bucket by earliest due time", () => {
    const items = [
      { id: "later-overdue", dueAt: new Date("2026-08-04T08:30:00Z") },
      { id: "earlier-overdue", dueAt: new Date("2026-08-02T08:30:00Z") },
    ];
    expect(sortAttentionItems(items, now).map((item) => item.id)).toEqual(["earlier-overdue", "later-overdue"]);
  });
});

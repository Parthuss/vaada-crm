import { describe, expect, it } from "vitest";
import { buildLeadContext, buildMessageContext } from "@/lib/ai/context";
import { dailyBriefSchema, leadInsightSchema, messageDraftSchema } from "@/lib/ai/schemas";

const lead = {
  id: "lead_1", name: "Priya Menon", company: "Meridian Foods", phone: "+91 99999 99999",
  email: "priya@example.com", city: "Pune", industry: "Food distribution", source: "Referral",
  status: "QUALIFIED", valuePaise: 12500000, notes: `Needs a catalog. ${"x".repeat(1200)}`,
  followUps: [{ kind: "CALL", note: "Discussed pricing", dueAt: new Date("2026-08-05T10:00:00Z"), completedAt: null }],
};

describe("AI data contracts", () => {
  it("AC-13: removes direct contact PII and bounds notes", () => {
    const context = buildLeadContext(lead);
    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain("99999");
    expect(serialized).not.toContain("priya@example.com");
    expect(serialized).not.toContain("Priya Menon");
    expect(context.notes.length).toBeLessThanOrEqual(600);
  });

  it("AC-13: bands an unset value as UNKNOWN and omits follow-ups when absent", () => {
    const bare = buildLeadContext({ id: "lead_2", name: "Anon", company: "NoValue Co", status: "NEW" });
    expect(bare.valueBand).toBe("UNKNOWN");
    expect(bare.recentFollowUps).toEqual([]);
  });

  it("AC-13: bands low and high potential values at the documented thresholds", () => {
    expect(buildLeadContext({ ...lead, valuePaise: 1_000_000 }).valueBand).toBe("UNDER_50K_INR");
    expect(buildLeadContext({ ...lead, valuePaise: 30_000_000 }).valueBand).toBe("OVER_250K_INR");
  });

  it("AC-13: message context includes only first name from contact identity", () => {
    const serialized = JSON.stringify(buildMessageContext(lead));
    expect(serialized).toContain("Priya");
    expect(serialized).not.toContain("Menon");
    expect(serialized).not.toContain("priya@example.com");
    expect(serialized).not.toContain("99999");
  });

  it("AC-9: validates a structured lead insight", () => {
    expect(leadInsightSchema.parse({ opportunity: "Strong fit", risk: "Budget unconfirmed", evidence: ["Referral source"], recommendedNextAction: "Share catalog", confidence: "MEDIUM", caveat: "No purchase history" })).toBeTruthy();
  });

  it("AC-10: rejects an empty message draft", () => {
    expect(messageDraftSchema.safeParse({ channel: "WHATSAPP", tone: "WARM", draft: "", callToAction: "Reply", safetyNote: "Review" }).success).toBe(false);
  });

  it("AC-11: validates a daily brief with traceable priorities", () => {
    expect(dailyBriefSchema.parse({ summary: "Three calls need attention.", priorities: [{ leadId: "lead_1", company: "Meridian Foods", reason: "Overdue", action: "Call today" }], risks: [], wins: [] })).toBeTruthy();
  });
});

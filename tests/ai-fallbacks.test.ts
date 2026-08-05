import { describe, expect, it } from "vitest";
import { dailyBriefFallback, leadInsightFallback, messageFallback } from "@/lib/ai/fallbacks";
import { dailyBriefSchema, leadInsightSchema, messageDraftSchema } from "@/lib/ai/schemas";

const lead = { id: "lead-1", name: "Neha Kulkarni", company: "Saffron Kitchens", status: "PROPOSAL", followUps: [{ dueAt: new Date("2026-08-01T10:00:00Z"), completedAt: null, note: "Send revised plan" }] };

describe("safe AI fallbacks", () => {
  it("returns a schema-valid lead insight grounded in CRM fields", () => {
    const result = leadInsightFallback(lead);
    expect(leadInsightSchema.parse(result)).toEqual(result);
    expect(result.evidence.join(" ")).toContain("PROPOSAL");
    expect(result.caveat).toContain("rules-based");
  });

  it("returns an editable schema-valid message without inventing an offer", () => {
    const result = messageFallback(lead, "WHATSAPP");
    expect(messageDraftSchema.parse(result)).toEqual(result);
    expect(result.draft).toContain("Neha");
    expect(result.draft).not.toMatch(/discount|guarantee/i);
  });

  it("returns a schema-valid daily brief with real lead ids", () => {
    const result = dailyBriefFallback([lead]);
    expect(dailyBriefSchema.parse(result)).toEqual(result);
    expect(result.priorities[0]?.leadId).toBe("lead-1");
  });

  it("handles an empty CRM without fabricating priorities", () => {
    const result = dailyBriefFallback([]);
    expect(result.priorities).toEqual([]);
    expect(result.summary).toContain("0 leads");
  });
});

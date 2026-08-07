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

  it("names the lack of an open follow-up when none is scheduled", () => {
    const result = leadInsightFallback({ ...lead, followUps: [] });
    expect(leadInsightSchema.parse(result)).toEqual(result);
    expect(result.risk).toMatch(/no open follow-up/i);
    expect(result.recommendedNextAction).toMatch(/schedule a specific next step/i);
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

  it("gives a lead with no overdue work a forward-looking reason and action", () => {
    const upcoming = { ...lead, id: "lead-2", followUps: [{ dueAt: new Date(Date.now() + 86_400_000), completedAt: null, note: "Confirm renewal date" }] };
    const result = dailyBriefFallback([upcoming]);
    expect(dailyBriefSchema.parse(result)).toEqual(result);
    expect(result.priorities[0]?.reason).toMatch(/open next step/i);
    expect(result.priorities[0]?.action).toBe("Confirm renewal date");
  });

  it("falls back to a generic action when a lead has no follow-ups at all", () => {
    const bare = { id: "lead-3", name: "Arjun Nair", company: "Cedar Learning", status: "NEW" };
    const result = dailyBriefFallback([bare]);
    expect(result.priorities[0]?.action).toMatch(/schedule a specific next step/i);
  });

  it("handles an empty CRM without fabricating priorities", () => {
    const result = dailyBriefFallback([]);
    expect(dailyBriefSchema.parse(result)).toEqual(result);
    expect(result.priorities).toEqual([]);
    expect(result.risks).toEqual([]);
    expect(result.summary).toMatch(/no active leads/i);
  });
});

import { describe, expect, it } from "vitest";
import { classifyAiError, isAiRateLimited, parseValidatedJson } from "@/lib/ai/resilience";
import { leadInsightSchema } from "@/lib/ai/schemas";

describe("AI resilience", () => {
  it.each([[408, "TRANSIENT"], [429, "RATE_LIMITED"], [503, "TRANSIENT"], [400, "INVALID_REQUEST"]])("AC-14: classifies upstream status %s", (status, expected) => {
    expect(classifyAiError({ status })).toBe(expected);
  });

  it("EC-6: rejects syntactically valid but schema-invalid JSON", () => {
    expect(() => parseValidatedJson('{"opportunity":"only one field"}', leadInsightSchema)).toThrow();
  });

  it("AC-15: limits the sixth request in a rolling minute", () => {
    expect(isAiRateLimited(4, 5)).toBe(false);
    expect(isAiRateLimited(5, 5)).toBe(true);
  });
});

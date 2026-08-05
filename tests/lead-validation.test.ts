import { describe, expect, it } from "vitest";
import { leadInputSchema } from "@/lib/domain/schemas";

describe("lead input", () => {
  it("AC-3: accepts a realistic lead", () => {
    expect(leadInputSchema.parse({ name: "Priya Menon", company: "Meridian Foods", status: "NEW", valuePaise: 12500000 })).toMatchObject({ company: "Meridian Foods" });
  });

  it.each([
    [{ name: "", company: "Acme", status: "NEW" }, "name"],
    [{ name: "A", company: "Acme", status: "INVALID" }, "status"],
    [{ name: "A", company: "Acme", status: "NEW", email: "bad" }, "email"],
    [{ name: "A", company: "Acme", status: "NEW", valuePaise: -1 }, "valuePaise"],
  ])("AC-3: rejects invalid field data", (input, path) => {
    const result = leadInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path.includes(path))).toBe(true);
  });
});

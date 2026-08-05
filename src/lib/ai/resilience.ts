import type { ZodType } from "zod";

export type AiErrorCategory = "RATE_LIMITED" | "TRANSIENT" | "INVALID_REQUEST" | "BLOCKED" | "INVALID_RESPONSE" | "UNAVAILABLE";

export function classifyAiError(error: unknown): AiErrorCategory {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : 0;
  if (status === 429) return "RATE_LIMITED";
  if (status === 408 || status >= 500) return "TRANSIENT";
  if (status >= 400) return "INVALID_REQUEST";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("safety") || message.includes("blocked")) return "BLOCKED";
  return "UNAVAILABLE";
}

export function parseValidatedJson<T>(text: string, schema: ZodType<T>): T {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("INVALID_RESPONSE_JSON"); }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new Error("INVALID_RESPONSE_SCHEMA");
  return result.data;
}

export const isAiRateLimited = (requestCount: number, limit = 5) => requestCount >= limit;

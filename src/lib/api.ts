import { ZodError } from "zod";

export function apiError(error: unknown, requestId = crypto.randomUUID()) {
  if (error instanceof ZodError) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Check the submitted fields", fieldErrors: error.flatten().fieldErrors, requestId } }, { status: 422 });
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return Response.json({ error: { code: "UNAUTHORIZED", message: "Please sign in again", requestId } }, { status: 401 });
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return Response.json({ error: { code: "NOT_FOUND", message: "That record no longer exists", requestId } }, { status: 404 });
  }
  if (error instanceof Error && error.message === "EDIT_CONFLICT") {
    return Response.json({ error: { code: "EDIT_CONFLICT", message: "This lead changed in another tab. Refresh before saving again.", requestId } }, { status: 409 });
  }
  if (error instanceof Error && error.message === "AI_RATE_LIMIT") {
    return Response.json({ error: { code: "RATE_LIMITED", message: "AI is taking a short breather. Try again in a minute.", requestId } }, { status: 429, headers: { "Retry-After": "60" } });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: { code: "INVALID_JSON", message: "The request body was not valid JSON", requestId } }, { status: 400 });
  }
  console.error(JSON.stringify({ level: "error", requestId, message: error instanceof Error ? error.message : "Unknown error" }));
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again.", requestId } }, { status: 500 });
}

export function cleanOptional(value: string | undefined) { return value || null; }

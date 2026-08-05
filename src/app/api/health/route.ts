import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok", version: process.env.APP_VERSION ?? "local", latencyMs: Date.now() - started, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", route: "/api/health", message: error instanceof Error ? error.message : "Database check failed" }));
    return Response.json({ status: "degraded", database: "unavailable", version: process.env.APP_VERSION ?? "local", timestamp: new Date().toISOString() }, { status: 503 });
  }
}

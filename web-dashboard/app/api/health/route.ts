import { NextResponse } from "next/server";
import { getResults } from "@/lib/data";

export const dynamic = "force-dynamic";

const startedAt = Date.now();

/**
 * Liveness + readiness probe. Returns 200 with dependency checks when
 * healthy, 503 when the app can't serve real traffic (e.g. the data bundle
 * is missing or corrupt) — this distinction matters for orchestrators
 * (Kubernetes, ECS) that use readiness to pull an instance out of rotation
 * without restarting it.
 */
export async function GET() {
  const checks: Record<string, "ok" | "fail"> = {};

  try {
    const results = getResults();
    checks.dataBundle = results.cohortAtt.length > 0 ? "ok" : "fail";
  } catch {
    checks.dataBundle = "fail";
  }

  const healthy = Object.values(checks).every((status) => status === "ok");

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 },
  );
}

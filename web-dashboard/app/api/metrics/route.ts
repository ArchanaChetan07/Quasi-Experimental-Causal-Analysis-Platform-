import { NextResponse } from "next/server";
import { getResults } from "@/lib/data";

export const dynamic = "force-dynamic";

const startedAt = Date.now();
let requestCount = 0;

/**
 * Minimal Prometheus text-exposition-format endpoint. Enough for a scrape
 * target in a real deployment (Prometheus, Grafana Agent, Datadog's OTLP
 * receiver, etc). Counters are process-local; in a multi-instance
 * deployment each instance reports its own counters, which is the normal
 * Prometheus model (aggregation happens at query time, not here).
 */
export async function GET() {
  requestCount += 1;
  const uptimeSeconds = Math.round((Date.now() - startedAt) / 1000);

  let dataBundleUp = 1;
  let cohortCount = 0;
  try {
    const results = getResults();
    cohortCount = results.cohortAtt.length;
  } catch {
    dataBundleUp = 0;
  }

  const lines = [
    "# HELP app_uptime_seconds Seconds since the process started.",
    "# TYPE app_uptime_seconds gauge",
    `app_uptime_seconds ${uptimeSeconds}`,
    "",
    "# HELP app_metrics_requests_total Total requests to /api/metrics.",
    "# TYPE app_metrics_requests_total counter",
    `app_metrics_requests_total ${requestCount}`,
    "",
    "# HELP app_data_bundle_up Whether the results data bundle loaded successfully (1) or not (0).",
    "# TYPE app_data_bundle_up gauge",
    `app_data_bundle_up ${dataBundleUp}`,
    "",
    "# HELP app_data_bundle_cohorts Number of cohorts present in the loaded data bundle.",
    "# TYPE app_data_bundle_cohorts gauge",
    `app_data_bundle_cohorts ${cohortCount}`,
    "",
  ];

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}

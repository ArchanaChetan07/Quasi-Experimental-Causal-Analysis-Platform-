/**
 * @jest-environment node
 */
import { GET as healthGET } from "@/app/api/health/route";
import { GET as metricsGET } from "@/app/api/metrics/route";

describe("GET /api/health", () => {
  it("returns 200 and status ok when the data bundle is healthy", async () => {
    const res = await healthGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.checks.dataBundle).toBe("ok");
    expect(typeof body.uptimeSeconds).toBe("number");
  });
});

describe("GET /api/metrics", () => {
  it("returns Prometheus-format text with expected metric names", async () => {
    const res = await metricsGET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const text = await res.text();
    expect(text).toContain("app_uptime_seconds");
    expect(text).toContain("app_data_bundle_up 1");
    expect(text).toContain("app_data_bundle_cohorts 3");
  });
});

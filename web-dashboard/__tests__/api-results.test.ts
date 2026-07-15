/**
 * @jest-environment node
 */
import { GET } from "@/app/api/results/route";

function makeRequest(url = "http://localhost/api/results", ip = "10.0.0.1") {
  return new Request(url, { headers: { "x-forwarded-for": ip } });
}

describe("GET /api/results", () => {
  it("returns the full results bundle with a 200 status", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("eventStudy");
    expect(body).toHaveProperty("cohortAtt");
    expect(body).toHaveProperty("psm");
    expect(body).toHaveProperty("summary");
  });

  it("includes expected cohorts in cohortAtt", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    const cohorts = body.cohortAtt.map((c: { cohort: string }) => c.cohort);
    expect(cohorts).toEqual(expect.arrayContaining(["early", "mid", "late"]));
  });

  it("attaches a request ID header for traceability", async () => {
    const res = await GET(makeRequest());
    expect(res.headers.get("X-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns only the requested cohort's event study when ?cohort= is set", async () => {
    const res = await GET(makeRequest("http://localhost/api/results?cohort=mid"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cohort).toBe("mid");
    expect(body).toHaveProperty("eventStudy");
    expect(body).not.toHaveProperty("cohortAtt");
  });

  it("rejects an invalid cohort query param with 400", async () => {
    const res = await GET(makeRequest("http://localhost/api/results?cohort=nonexistent"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid query parameters");
  });

  it("rate-limits a client after exceeding the per-minute threshold", async () => {
    const ip = "10.0.0.99"; // distinct key so this test doesn't collide with others
    let lastStatus = 200;
    for (let i = 0; i < 121; i++) {
      const res = await GET(makeRequest("http://localhost/api/results", ip));
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});

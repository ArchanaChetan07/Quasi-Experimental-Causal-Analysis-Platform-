import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

/**
 * Load test for the dashboard's key routes. Run with:
 *   k6 run load-test/dashboard.js
 * or with a custom target/duration:
 *   BASE_URL=https://staging.example.com k6 run -u 50 -d 2m load-test/dashboard.js
 *
 * This is intentionally read-only (GET requests against static/cached
 * routes) and safe to run against a staging environment without side
 * effects.
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const errorRate = new Rate("errors");

export const options = {
  scenarios: {
    steady_load: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS) || 20,
      duration: __ENV.DURATION || "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    errors: ["rate<0.01"],
  },
};

export default function () {
  const responses = http.batch([
    ["GET", `${BASE_URL}/`],
    ["GET", `${BASE_URL}/api/results`],
    ["GET", `${BASE_URL}/api/health`],
  ]);

  for (const res of responses) {
    const ok = check(res, {
      "status is 200 or 429": (r) => r.status === 200 || r.status === 429,
      "responds within 1s": (r) => r.timings.duration < 1000,
    });
    errorRate.add(!ok);
  }

  sleep(1);
}

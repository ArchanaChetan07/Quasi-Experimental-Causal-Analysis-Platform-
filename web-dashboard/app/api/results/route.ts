import { NextResponse } from "next/server";
import { getResults } from "@/lib/data";
import { logger, generateRequestId } from "@/lib/logger";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { resultsQuerySchema } from "@/lib/schemas";

// Dynamic (not force-static) because rate limiting and query params require
// per-request handling. The underlying data read is still a cheap, cached
// in-memory lookup (see lib/data.ts), so this stays fast.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = generateRequestId();
  const start = performance.now();
  const log = logger.child({ requestId, route: "/api/results" });

  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(`results:${clientKey}`);
  if (!rateLimit.allowed) {
    log.warn({ clientKey }, "rate limit exceeded");
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          "X-Request-Id": requestId,
        },
      },
    );
  }

  const url = new URL(request.url);
  const parsed = resultsQuerySchema.safeParse({
    cohort: url.searchParams.get("cohort") ?? undefined,
  });

  if (!parsed.success) {
    log.warn({ issues: parsed.error.issues }, "invalid query params");
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.issues },
      { status: 400, headers: { "X-Request-Id": requestId } },
    );
  }

  try {
    const results = getResults();
    const { cohort } = parsed.data;

    const body = cohort
      ? {
          generatedAt: results.generatedAt,
          cohort,
          eventStudy: results.eventStudy[cohort],
        }
      : results;

    const durationMs = Math.round(performance.now() - start);
    log.info(
      { durationMs, cohort: cohort ?? "all", remaining: rateLimit.remaining },
      "served results",
    );

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "X-Request-Id": requestId,
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error({ err: message }, "failed to serve results");
    return NextResponse.json(
      { error: message, requestId },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}

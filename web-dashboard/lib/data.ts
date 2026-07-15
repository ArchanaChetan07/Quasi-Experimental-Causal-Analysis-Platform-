import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { ResultsBundle } from "@/lib/types";
import { resultsBundleSchema } from "@/lib/schemas";

let cache: ResultsBundle | null = null;

/**
 * Loads the prepared analysis results bundle from disk.
 * The bundle is generated ahead of time by `npm run prepare-data`
 * (scripts/prepare-data.mjs) from the upstream Python analysis outputs,
 * so this stays a fast, dependency-free filesystem read at request time.
 * Parsed with Zod so corrupt / partial JSON fails loudly at load time.
 */
export function getResults(): ResultsBundle {
  if (cache) return cache;

  const filePath = path.join(process.cwd(), "data", "results.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(
      "data/results.json not found. Run `npm run prepare-data` first (see README).",
    );
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = resultsBundleSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(
      `data/results.json failed schema validation: ${parsed.error.message}. Re-run \`npm run prepare-data\`.`,
    );
  }
  cache = parsed.data as ResultsBundle;
  return cache;
}

/** Test helper — clears the in-process cache between cases. */
export function clearResultsCache(): void {
  cache = null;
}

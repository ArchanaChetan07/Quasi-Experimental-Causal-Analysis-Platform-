import { z } from "zod";

/**
 * Query params accepted by GET /api/results.
 * `cohort` lets a consumer request a single cohort's event-study series
 * instead of the full bundle (useful for future widgets / partners that
 * only need one slice of data).
 */
export const resultsQuerySchema = z.object({
  cohort: z.enum(["early", "mid", "late", "pooled"]).optional(),
});

export type ResultsQuery = z.infer<typeof resultsQuerySchema>;

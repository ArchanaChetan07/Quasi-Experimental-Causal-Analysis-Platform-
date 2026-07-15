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

const eventStudyPointSchema = z.object({
  rel_time: z.number(),
  coef: z.number(),
  se: z.number(),
  ci_low: z.number(),
  ci_high: z.number(),
});

const cohortAttSchema = z.object({
  cohort: z.enum(["early", "mid", "late"]),
  att: z.number(),
  se: z.number(),
  ci_low: z.number(),
  ci_high: z.number(),
  n_treated_mkts: z.number(),
  n_control_mkts: z.number(),
});

const balanceRowSchema = z.object({
  covariate: z.string(),
  treated_mean: z.number(),
  control_mean: z.number().optional(),
  matched_control_mean: z.number().optional(),
  std_mean_diff: z.number(),
});

const matchedPairSchema = z.object({
  market: z.string(),
  post_log_gmv_treated: z.number(),
  post_log_gmv_matched_control: z.number(),
  pscore_treated: z.number(),
  pscore_matched_control_mean: z.number(),
  ind_att: z.number(),
});

const ciTuple = z.tuple([z.number(), z.number()]);

export const resultsBundleSchema = z.object({
  generatedAt: z.string(),
  eventStudy: z.object({
    pooled: z.array(eventStudyPointSchema).min(1),
    early: z.array(eventStudyPointSchema).min(1),
    mid: z.array(eventStudyPointSchema).min(1),
    late: z.array(eventStudyPointSchema).min(1),
  }),
  cohortAtt: z.array(cohortAttSchema).min(1),
  psm: z.object({
    balanceBefore: z.array(balanceRowSchema).min(1),
    balanceAfter: z.array(balanceRowSchema).min(1),
    matchedPairs: z.array(matchedPairSchema),
  }),
  summary: z.object({
    twfe: z.object({
      att: z.number(),
      se: z.number(),
      ci: ciTuple,
      impliedPct: z.number(),
    }),
    parallelTrends: z.object({
      fStat: z.number(),
      pValue: z.number(),
      rejected: z.boolean(),
    }),
    cohortPretrendPValues: z.array(z.object({ cohort: z.string(), pValue: z.number() })).min(1),
    psm: z.object({
      att: z.number(),
      se: z.number(),
      ci: ciTuple,
      impliedPct: z.number(),
    }),
  }),
});

export type ResultsBundleParsed = z.infer<typeof resultsBundleSchema>;

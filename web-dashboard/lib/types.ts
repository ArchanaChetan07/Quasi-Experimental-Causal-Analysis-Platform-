export interface EventStudyPoint {
  rel_time: number;
  coef: number;
  se: number;
  ci_low: number;
  ci_high: number;
}

export interface CohortAtt {
  cohort: "early" | "mid" | "late";
  att: number;
  se: number;
  ci_low: number;
  ci_high: number;
  n_treated_mkts: number;
  n_control_mkts: number;
}

export interface BalanceRow {
  covariate: string;
  treated_mean: number;
  control_mean?: number;
  matched_control_mean?: number;
  std_mean_diff: number;
}

export interface MatchedPair {
  market: string;
  post_log_gmv_treated: number;
  post_log_gmv_matched_control: number;
  pscore_treated: number;
  pscore_matched_control_mean: number;
  ind_att: number;
}

export interface ResultsBundle {
  generatedAt: string;
  eventStudy: {
    pooled: EventStudyPoint[];
    early: EventStudyPoint[];
    mid: EventStudyPoint[];
    late: EventStudyPoint[];
  };
  cohortAtt: CohortAtt[];
  psm: {
    balanceBefore: BalanceRow[];
    balanceAfter: BalanceRow[];
    matchedPairs: MatchedPair[];
  };
  summary: {
    twfe: { att: number; se: number; ci: [number, number]; impliedPct: number };
    parallelTrends: { fStat: number; pValue: number; rejected: boolean };
    cohortPretrendPValues: { cohort: string; pValue: number }[];
    psm: { att: number; se: number; ci: [number, number]; impliedPct: number };
  };
}

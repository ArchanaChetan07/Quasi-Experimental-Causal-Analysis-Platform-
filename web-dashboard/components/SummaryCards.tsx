import type { ResultsBundle } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

function pct(x: number) {
  return `${x >= 0 ? "+" : ""}${x.toFixed(1)}%`;
}

export function SummaryCards({
  summary,
  cohortAtt,
}: {
  summary: ResultsBundle["summary"];
  cohortAtt: ResultsBundle["cohortAtt"];
}) {
  const midLate = cohortAtt.filter((c) => c.cohort !== "early");
  const midLateAvgPct =
    midLate.length > 0
      ? midLate.reduce((sum, c) => sum + (Math.exp(c.att) - 1) * 100, 0) / midLate.length
      : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
        marginBottom: 28,
      }}
      data-testid="summary-cards"
    >
      <div className="card">
        <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 6 }}>
          Naive pooled TWFE
        </div>
        <div style={{ fontSize: 30, fontWeight: 700 }}>{pct(summary.twfe.impliedPct)}</div>
        <div style={{ marginTop: 10 }}>
          <StatusBadge tone="danger">Parallel trends rejected (p = {summary.parallelTrends.pValue})</StatusBadge>
        </div>
      </div>

      <div className="card">
        <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 6 }}>
          Cohort-robust average (mid + late)
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "var(--accent-2)" }}>
          {midLateAvgPct !== null ? `~${pct(midLateAvgPct)}` : "n/a"}
        </div>
        <div style={{ marginTop: 10 }}>
          <StatusBadge tone="ok">Closest to ground truth</StatusBadge>
        </div>
      </div>

      <div className="card">
        <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 6 }}>
          Propensity score matching
        </div>
        <div style={{ fontSize: 30, fontWeight: 700 }}>{pct(summary.psm.impliedPct)}</div>
        <div style={{ marginTop: 10 }}>
          <StatusBadge tone="warn">Wide CI, imperfect balance</StatusBadge>
        </div>
      </div>

      <div className="card">
        <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 6 }}>
          Recommended headline range
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>+6% to +9%</div>
        <div style={{ marginTop: 10 }}>
          <StatusBadge tone="ok">Based on mid/late cohorts</StatusBadge>
        </div>
      </div>
    </div>
  );
}

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
  const midLatePcts = midLate.map((c) => (Math.exp(c.att) - 1) * 100);
  const midLateAvgPct =
    midLatePcts.length > 0
      ? midLatePcts.reduce((sum, x) => sum + x, 0) / midLatePcts.length
      : null;
  const headlineLo = midLatePcts.length > 0 ? Math.min(...midLatePcts) : null;
  const headlineHi = midLatePcts.length > 0 ? Math.max(...midLatePcts) : null;

  const ptRejected = summary.parallelTrends.rejected;
  const psmCiWidth = summary.psm.ci[1] - summary.psm.ci[0];
  const psmWideCi = psmCiWidth > 0.2;

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
          <StatusBadge tone={ptRejected ? "danger" : "ok"}>
            {ptRejected
              ? `Parallel trends rejected (p = ${summary.parallelTrends.pValue})`
              : `Cannot reject parallel trends (p = ${summary.parallelTrends.pValue})`}
          </StatusBadge>
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
          <StatusBadge tone={psmWideCi ? "warn" : "ok"}>
            {psmWideCi ? "Wide CI, imperfect balance" : "PSM robustness check"}
          </StatusBadge>
        </div>
      </div>

      <div className="card">
        <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 6 }}>
          Recommended headline range
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          {headlineLo !== null && headlineHi !== null
            ? `${pct(headlineLo)} to ${pct(headlineHi)}`
            : "n/a"}
        </div>
        <div style={{ marginTop: 10 }}>
          <StatusBadge tone="ok">Based on mid/late cohorts</StatusBadge>
        </div>
      </div>
    </div>
  );
}

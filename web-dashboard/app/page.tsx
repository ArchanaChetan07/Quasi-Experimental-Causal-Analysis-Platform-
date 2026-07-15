import { getResults } from "@/lib/data";
import { SummaryCards } from "@/components/SummaryCards";
import { Section } from "@/components/Section";
import { EventStudyChart } from "@/components/EventStudyChart";
import { CohortAttChart } from "@/components/CohortAttChart";
import { BalanceChart } from "@/components/BalanceChart";
import { BalanceTable } from "@/components/BalanceTable";
import { StatusBadge, toneForPValue } from "@/components/StatusBadge";

export const dynamic = "force-static";

export default function DashboardPage() {
  const results = getResults();
  const { eventStudy, cohortAtt, psm, summary } = results;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <main className="container" id="main-content">
        <header style={{ marginBottom: 32 }}>
          <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 8 }}>
            Causal Inference &middot; Staggered Rollout Analysis
          </div>
          <h1 style={{ fontSize: 32, margin: 0 }}>
            Did the feature actually drive GMV &mdash; or did we just launch it in markets that were
            already winning?
          </h1>
          <p style={{ color: "var(--text-dim)", maxWidth: 760, marginTop: 12 }}>
            Difference-in-differences and propensity-score-matching analysis of a three-wave,
            non-randomized market rollout, with explicit assumption testing rather than a single
            unconditional causal claim.
          </p>
        </header>

        <SummaryCards summary={summary} cohortAtt={cohortAtt} />

        <Section
          title="Parallel trends test"
          subtitle="Pooled event study: pre-period coefficients should be flat around zero if parallel trends holds. They are not."
        >
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span style={{ color: "var(--text-dim)", fontSize: 14 }}>
                Joint F-test on pre-treatment leads: F = {summary.parallelTrends.fStat}, p ={" "}
                {summary.parallelTrends.pValue}
              </span>
              <StatusBadge tone={summary.parallelTrends.rejected ? "danger" : "ok"}>
                {summary.parallelTrends.rejected
                  ? "Parallel trends rejected"
                  : "Cannot reject parallel trends"}
              </StatusBadge>
            </div>
            <EventStudyChart data={eventStudy.pooled} color="#5b8cff" />
            <p className="sr-only">
              Chart data: pre-treatment coefficients trend away from zero at longer lags, indicating
              a parallel trends violation in the pooled sample. Exact values are in
              event_study_pooled.csv / the prepared results JSON.
            </p>
          </div>
        </Section>

        <Section
          title="Cohort-specific event studies"
          subtitle="Splitting by rollout wave shows the violation is concentrated in the early cohort, not spread evenly."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {(["early", "mid", "late"] as const).map((cohort) => {
              const colorMap = { early: "#ff6b6b", mid: "#5b8cff", late: "#7bd88f" };
              const pv = summary.cohortPretrendPValues.find((c) => c.cohort === cohort);
              return (
                <div className="card" key={cohort}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ textTransform: "capitalize" }}>{cohort} cohort</strong>
                    {pv && (
                      <StatusBadge tone={toneForPValue(pv.pValue)}>
                        pre-trend p = {pv.pValue}
                      </StatusBadge>
                    )}
                  </div>
                  <EventStudyChart
                    data={eventStudy[cohort]}
                    color={colorMap[cohort]}
                    height={220}
                  />
                  <p className="sr-only">
                    Event-study coefficients for the {cohort} cohort. Pre-trend joint p-value:{" "}
                    {pv?.pValue ?? "n/a"}.
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="Treatment effect estimates"
          subtitle="Heterogeneity-robust, not-yet-treated comparisons per cohort vs. the naive pooled TWFE estimate."
        >
          <div className="card">
            <CohortAttChart data={cohortAtt} twfeAtt={summary.twfe.att} twfeCi={summary.twfe.ci} />
            <table style={{ marginTop: 16 }}>
              <caption>
                Treatment effect estimate, standard error, 95% confidence interval, and market
                counts per rollout cohort, compared to the naive pooled TWFE estimate.
              </caption>
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>ATT (log pts)</th>
                  <th>95% CI</th>
                  <th>Implied %</th>
                  <th>Treated / control markets</th>
                </tr>
              </thead>
              <tbody>
                {cohortAtt.map((c) => (
                  <tr key={c.cohort}>
                    <td style={{ textTransform: "capitalize" }}>{c.cohort}</td>
                    <td>{c.att.toFixed(4)}</td>
                    <td>
                      [{c.ci_low.toFixed(3)}, {c.ci_high.toFixed(3)}]
                    </td>
                    <td>{((Math.exp(c.att) - 1) * 100).toFixed(1)}%</td>
                    <td>
                      {c.n_treated_mkts} / {c.n_control_mkts}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Naive pooled TWFE</td>
                  <td>{summary.twfe.att.toFixed(4)}</td>
                  <td>
                    [{summary.twfe.ci[0].toFixed(3)}, {summary.twfe.ci[1].toFixed(3)}]
                  </td>
                  <td>{summary.twfe.impliedPct.toFixed(1)}%</td>
                  <td>&mdash;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Propensity score matching (robustness check)"
          subtitle="Matching ever-treated to never-treated markets on pre-period covariates. Balance remains imperfect after matching."
        >
          <div className="psm-grid">
            <div className="card">
              <BalanceChart before={psm.balanceBefore} after={psm.balanceAfter} />
            </div>
            <div className="card">
              <BalanceTable before={psm.balanceBefore} after={psm.balanceAfter} />
              <div style={{ marginTop: 16, fontSize: 14, color: "var(--text-dim)" }}>
                Matched ATT:{" "}
                <strong style={{ color: "var(--text)" }}>
                  {summary.psm.impliedPct.toFixed(1)}%
                </strong>{" "}
                (95% CI [{summary.psm.ci[0].toFixed(3)}, {summary.psm.ci[1].toFixed(3)}] in log
                points)
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-dim)" }}>
                Matched pairs: {psm.matchedPairs.length} treated markets (1:2 NN with replacement).
              </div>
            </div>
          </div>
        </Section>

        <footer
          style={{
            color: "var(--text-dim)",
            fontSize: 12,
            marginTop: 40,
            borderTop: "1px solid var(--border)",
            paddingTop: 16,
          }}
        >
          Results generated {new Date(results.generatedAt).toLocaleString()}. Data pipeline:{" "}
          <code>npm run prepare-data</code> from the upstream Python DiD/PSM analysis.
        </footer>
      </main>
    </>
  );
}

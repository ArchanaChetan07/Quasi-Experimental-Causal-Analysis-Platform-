import type { BalanceRow } from "@/lib/types";

export function BalanceTable({ before, after }: { before: BalanceRow[]; after: BalanceRow[] }) {
  return (
    <table>
      <caption>
        Standardized mean difference (SMD) for each matching covariate, before and after
        propensity-score matching, with a pass/fail against the 0.10 balance threshold.
      </caption>
      <thead>
        <tr>
          <th>Covariate</th>
          <th>SMD before</th>
          <th>SMD after</th>
          <th>Balanced?</th>
        </tr>
      </thead>
      <tbody>
        {before.map((row, i) => {
          const afterRow = after[i];
          const afterSmd = afterRow?.std_mean_diff ?? null;
          const balanced = afterSmd !== null && Math.abs(afterSmd) < 0.1;
          return (
            <tr key={row.covariate}>
              <td>{row.covariate}</td>
              <td>{row.std_mean_diff.toFixed(3)}</td>
              <td>{afterSmd !== null ? afterSmd.toFixed(3) : "\u2014"}</td>
              <td style={{ color: balanced ? "var(--accent-2)" : "var(--danger)" }}>
                {balanced ? "Yes" : "No"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

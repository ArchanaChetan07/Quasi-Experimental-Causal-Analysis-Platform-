"use client";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import type { BalanceRow } from "@/lib/types";

export function BalanceChart({
  before,
  after,
}: {
  before: BalanceRow[];
  after: BalanceRow[];
}) {
  const afterByCov = new Map(after.map((a) => [a.covariate, a]));
  const covariates = before.map((b) => b.covariate);
  const beforePoints = before.map((b, i) => ({ x: b.std_mean_diff, y: i, covariate: b.covariate }));
  const afterPoints = before.map((b, i) => {
    const a = afterByCov.get(b.covariate);
    return { x: a?.std_mean_diff ?? null, y: i, covariate: b.covariate };
  }).filter((p): p is { x: number; y: number; covariate: string } => p.x !== null);

  const allX = [...beforePoints.map((p) => p.x), ...afterPoints.map((p) => p.x)];
  const xMin = Math.min(-0.2, ...allX, -0.1) - 0.05;
  const xMax = Math.max(1.4, ...allX, 0.1) + 0.05;

  return (
    <div style={{ width: "100%", minWidth: 0, height: 260, minHeight: 260 }} data-testid="balance-chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={260}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#253150" />
          <XAxis
            type="number"
            dataKey="x"
            stroke="#9aa7c2"
            tick={{ fontSize: 12 }}
            domain={[xMin, xMax]}
            label={{ value: "Standardized mean difference", position: "bottom", fill: "#9aa7c2", fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            stroke="#9aa7c2"
            tick={{ fontSize: 12 }}
            domain={[-0.5, covariates.length - 0.5]}
            ticks={covariates.map((_, i) => i)}
            tickFormatter={(v: number) => covariates[v] ?? ""}
            width={110}
          />
          <Tooltip
            contentStyle={{ background: "#121a2b", border: "1px solid #253150", borderRadius: 8 }}
            labelStyle={{ color: "#e8ecf6" }}
            formatter={(value: number) => value.toFixed(3)}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#9aa7c2" }} />
          <ReferenceLine x={0.1} stroke="#586278" strokeDasharray="4 4" />
          <ReferenceLine x={-0.1} stroke="#586278" strokeDasharray="4 4" />
          <Scatter name="Before matching" data={beforePoints} fill="#ff6b6b" />
          <Scatter name="After matching" data={afterPoints} fill="#5b8cff" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

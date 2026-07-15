"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ErrorBar,
  ReferenceLine,
} from "recharts";
import type { CohortAtt } from "@/lib/types";

const COHORT_COLORS: Record<string, string> = {
  early: "#ff6b6b",
  mid: "#5b8cff",
  late: "#7bd88f",
};

export function CohortAttChart({
  data,
  twfeAtt,
  twfeCi,
}: {
  data: CohortAtt[];
  twfeAtt: number;
  twfeCi?: [number, number];
}) {
  const chartData = [
    ...data.map((d) => ({
      name: d.cohort,
      att: d.att,
      // Symmetric half-width approx; Recharts ErrorBar is ±errorY from the point
      errorY: Math.max(d.ci_high - d.att, d.att - d.ci_low),
      fill: COHORT_COLORS[d.cohort] ?? "#8b96ab",
    })),
    {
      name: "naive TWFE",
      att: twfeAtt,
      errorY: twfeCi ? Math.max(twfeCi[1] - twfeAtt, twfeAtt - twfeCi[0]) : 0,
      fill: "#586278",
    },
  ];

  return (
    <div
      style={{ width: "100%", minWidth: 0, height: 280, minHeight: 280 }}
      data-testid="cohort-att-chart"
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#253150" />
          <XAxis dataKey="name" stroke="#9aa7c2" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9aa7c2" tick={{ fontSize: 12 }} width={50} />
          <Tooltip
            contentStyle={{ background: "#121a2b", border: "1px solid #253150", borderRadius: 8 }}
            labelStyle={{ color: "#e8ecf6" }}
            formatter={(value: number) => value.toFixed(4)}
          />
          <ReferenceLine y={0} stroke="#586278" />
          <Bar dataKey="att" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
            <ErrorBar dataKey="errorY" width={4} strokeWidth={1.5} stroke="#e8ecf6" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

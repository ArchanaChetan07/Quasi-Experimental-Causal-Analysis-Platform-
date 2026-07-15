"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { EventStudyPoint } from "@/lib/types";

export function EventStudyChart({
  data,
  color = "#5b8cff",
  height = 280,
}: {
  data: EventStudyPoint[];
  color?: string;
  height?: number;
}) {
  const chartData = data.map((d) => ({
    ...d,
    band: [d.ci_low, d.ci_high],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#253150" />
        <XAxis
          dataKey="rel_time"
          stroke="#9aa7c2"
          tick={{ fontSize: 12 }}
          label={{ value: "Weeks relative to launch", position: "bottom", fill: "#9aa7c2", fontSize: 12 }}
        />
        <YAxis stroke="#9aa7c2" tick={{ fontSize: 12 }} width={50} />
        <Tooltip
          contentStyle={{ background: "#121a2b", border: "1px solid #253150", borderRadius: 8 }}
          labelStyle={{ color: "#e8ecf6" }}
          formatter={(value: number) => value.toFixed(4)}
        />
        <ReferenceLine y={0} stroke="#586278" />
        <ReferenceLine x={-0.5} stroke="#ff6b6b" strokeDasharray="4 4" />
        <Area
          dataKey="band"
          stroke="none"
          fill={color}
          fillOpacity={0.12}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="coef"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

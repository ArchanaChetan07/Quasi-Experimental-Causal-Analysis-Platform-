import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Causal Inference Dashboard | Staggered Rollout Analysis",
  description:
    "DiD and propensity-score-matching analysis of a staggered marketplace feature rollout, with explicit assumption testing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

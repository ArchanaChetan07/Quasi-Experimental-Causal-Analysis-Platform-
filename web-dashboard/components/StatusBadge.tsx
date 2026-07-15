import clsx from "clsx";

type Tone = "ok" | "warn" | "danger";

export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={clsx("badge", {
        "badge-ok": tone === "ok",
        "badge-warn": tone === "warn",
        "badge-danger": tone === "danger",
      })}
    >
      {children}
    </span>
  );
}

/** Maps a p-value to a badge tone using conventional significance thresholds. */
export function toneForPValue(p: number): Tone {
  if (p < 0.01) return "danger";
  if (p < 0.05) return "warn";
  return "ok";
}

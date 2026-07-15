"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real deployment this reports to Sentry/Datadog/etc. Logged here
    // so the failure is at least visible in server/browser console output.
    // eslint-disable-next-line no-console
    console.error("Dashboard render error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="container" role="alert">
      <div className="card" style={{ maxWidth: 520, margin: "80px auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: "var(--text-dim)", marginBottom: 20 }}>
          The dashboard hit an unexpected error while rendering. This has been logged.
          {error.digest && <> Reference: <code>{error.digest}</code></>}
        </p>
        <button
          onClick={reset}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

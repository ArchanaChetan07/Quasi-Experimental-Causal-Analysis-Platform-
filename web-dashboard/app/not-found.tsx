import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: "var(--text-dim)", marginBottom: 20 }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" style={{ color: "var(--accent)" }}>
          Back to the dashboard
        </Link>
      </div>
    </div>
  );
}

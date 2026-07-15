export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const headingId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section style={{ marginBottom: 32 }} aria-labelledby={headingId}>
      <h2 id={headingId} style={{ fontSize: 20, marginBottom: 4 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 0, marginBottom: 16 }}>
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

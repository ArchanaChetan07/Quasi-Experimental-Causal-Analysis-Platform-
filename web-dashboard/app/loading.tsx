export default function Loading() {
  return (
    <main className="container" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton" style={{ height: 40, width: "60%", marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 20, width: "80%", marginBottom: 32 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 320, borderRadius: 12, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
    </main>
  );
}

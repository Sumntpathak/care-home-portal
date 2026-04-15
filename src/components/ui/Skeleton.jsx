// Skeleton loaders — consistent loading states across all pages
export function Skeleton({ width = "100%", height = "16px", borderRadius = "6px", style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: "var(--border)",
      animation: "pulse 1.4s ease infinite",
      ...style,
    }} />
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "20px",
    }}>
      <Skeleton width="40%" height="12px" style={{ marginBottom: "16px" }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          style={{
            marginBottom: i < rows - 1 ? "8px" : "0",
            width: i === rows - 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}

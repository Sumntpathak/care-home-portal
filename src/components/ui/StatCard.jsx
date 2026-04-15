// Clinical StatCard — KPI display component
export function StatCard({ title, value, unit, trend, icon: Icon, color = "primary", loading, onClick }) {
  const colorMap = {
    primary: { bg: "var(--primary-light)", text: "var(--primary)", border: "rgba(8,145,178,.15)" },
    success: { bg: "var(--success-light)", text: "var(--success)", border: "rgba(22,163,74,.15)" },
    warning: { bg: "var(--warning-light)", text: "var(--warning)", border: "rgba(217,119,6,.15)" },
    danger:  { bg: "var(--danger-light)",  text: "var(--danger)",  border: "rgba(220,38,38,.15)" },
    purple:  { bg: "#f5f3ff",              text: "#7c3aed",        border: "rgba(124,58,237,.15)" },
  };
  const c = colorMap[color] || colorMap.primary;

  if (loading) {
    return (
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        animation: "pulse 1.5s ease infinite",
      }}>
        <div style={{ height: "12px", background: "var(--border)", borderRadius: "6px", width: "60%", marginBottom: "12px" }} />
        <div style={{ height: "28px", background: "var(--border)", borderRadius: "6px", width: "40%" }} />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--card)",
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        padding: "18px 20px",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow .15s, transform .15s",
        boxShadow: "var(--shadow)",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = "var(--shadow)"; }}
    >
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "10px",
      }}>
        <div style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: ".6px",
        }}>
          {title}
        </div>
        {Icon && (
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            background: c.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={17} style={{ color: c.text }} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span style={{
          fontSize: "26px",
          fontWeight: "700",
          color: "var(--text)",
          letterSpacing: "-1px",
          lineHeight: 1,
        }}>
          {value ?? "—"}
        </span>
        {unit && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
            {unit}
          </span>
        )}
      </div>

      {trend && (
        <div style={{
          fontSize: "11px",
          color: trend.up ? "var(--success)" : "var(--danger)",
          marginTop: "6px",
          fontWeight: "600",
        }}>
          {trend.up ? "▲" : "▼"} {trend.value}
        </div>
      )}
    </div>
  );
}

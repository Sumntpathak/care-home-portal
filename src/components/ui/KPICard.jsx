import { ArrowUpRight } from "lucide-react";

const hexBg = (hex) => hex + "18";

const COLORS = {
  teal:   { hex: "#06B6D4" },
  green:  { hex: "#10B981" },
  blue:   { hex: "#3B82F6" },
  indigo: { hex: "#6366F1" },
  purple: { hex: "#8B5CF6" },
  orange: { hex: "#F97316" },
  red:    { hex: "#EF4444" },
  amber:  { hex: "#F59E0B" },
  yellow: { hex: "#F59E0B" },
  gray:   { hex: "#64748B" },
  pink:   { hex: "#EC4899" },
};

export default function KPICard({ title, value, icon: Icon, color = "indigo", subtitle, loading, onClick }) {
  const c = COLORS[color] || COLORS.indigo;

  return (
    <div
      className={`kpi-card${onClick ? " kpi-card-clickable" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Icon box — 34×34 */}
        <div className="kpi-card-icon" style={{ background: hexBg(c.hex), color: c.hex }}>
          {loading ? (
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(255,255,255,.08)", animation: "shimmer 1.5s infinite" }} />
          ) : (
            Icon && <Icon size={20} strokeWidth={1.5} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Value — large */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {loading ? (
              <div style={{ width: 40, height: 18, borderRadius: 4, background: "rgba(255,255,255,.06)", animation: "shimmer 1.5s infinite" }} />
            ) : (
              <span className="kpi-value">{value ?? "—"}</span>
            )}
          </div>
          {/* Label below value */}
          <p className="kpi-label">{title}</p>
          {subtitle && <p className="kpi-sub">{subtitle}</p>}
        </div>

        {onClick && <ArrowUpRight size={13} className="kpi-arrow" style={{ flexShrink: 0 }} />}
      </div>
    </div>
  );
}

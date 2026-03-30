import { useState, useEffect, useMemo } from "react";
import {
  getHomeCarePatients, getIncidents, getVisitors, getBilling, getMedicines, getMedSchedule,
  getAppointments, getPrescriptions, getUsers,
} from "../api/sheets";
import {
  BarChart3, TrendingUp, AlertTriangle, Users, IndianRupee,
  BedDouble, Pill, Stethoscope, Calendar, Package, Activity,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   CLEAN CHART COMPONENTS
   ══════════════════════════════════════════════════════════════ */

const COLORS = ["#4f8cdb","#5ba08c","#7c8cc4","#d4956a","#9b7ec8","#d4685a","#14b8a6","#6366f1"];

function resolveColor(color, idx = 0) {
  if (color && color.startsWith("#")) return color;
  if (color && color.includes("--danger"))  return "#d4685a";
  if (color && color.includes("--success")) return "#5ba08c";
  if (color && color.includes("--warning")) return "#d4956a";
  if (color && color.includes("--info"))    return "#4f8cdb";
  if (color && color.includes("--purple"))  return "#9b7ec8";
  return COLORS[idx % COLORS.length];
}

/* ── HBarChart ── Clean horizontal bar chart ── */
function HBarChart({ items, color, formatValue, maxOverride }) {
  const max = maxOverride || Math.max(...items.map(i => i.value), 1);
  const fmt = formatValue || (v => v);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item, idx) => {
        const pct = max ? Math.min((item.value / max) * 100, 100) : 0;
        const c = item.color || resolveColor(color, idx);
        return (
          <div key={item.label + idx}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>{item.label}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: c }}>{fmt(item.value)}</span>
            </div>
            <div style={{ height: "6px", background: "var(--border-light, var(--subtle))", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${Math.max(pct, 1)}%`,
                background: c, borderRadius: "3px",
                transition: "width 0.5s ease",
                opacity: 0.85,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── DonutChart ── SVG donut ring chart ── */
function DonutChart({ segments, size = 120, strokeWidth = 14, centerLabel, centerValue }) {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let acc = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--subtle)" strokeWidth={strokeWidth} />
          {segments.map((seg, idx) => {
            const pct = total ? seg.value / total : 0;
            const dash = pct * circ;
            const offset = total ? -(acc / total) * circ : 0;
            acc += seg.value;
            const c = resolveColor(seg.color, idx);
            return (
              <circle key={seg.label+idx} cx={size/2} cy={size/2} r={radius}
                fill="none" stroke={c} strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset}
                style={{ transition: "all 0.5s ease" }} />
            );
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
            {centerValue && <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>{centerValue}</div>}
            {centerLabel && <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "1px" }}>{centerLabel}</div>}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
        {segments.map((seg, idx) => (
          <div key={seg.label+idx} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: resolveColor(seg.color, idx), flexShrink: 0 }} />
            <span style={{ color: "var(--text-secondary)" }}>{seg.label}</span>
            <span style={{ fontWeight: 600, color: "var(--text)" }}>{seg.displayValue || seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MiniStatCard ── Clean stat card ── */
function MiniStatCard({ icon: Icon, value, label, color = "blue" }) {
  const c = resolveColor(color);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "14px 16px", borderRadius: "var(--radius-sm, 10px)",
      background: "var(--card)", border: "1px solid var(--border)",
    }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "8px",
        background: "var(--subtle)", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={17} style={{ color: c }} />
      </div>
      <div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{label}</div>
      </div>
    </div>
  );
}

/* ── MetricRow ── Clean row for key-value displays ── */
function MetricRow({ icon: Icon, label, value, subValue, color = "blue" }) {
  const c = resolveColor(color);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "8px 12px", borderRadius: "6px", borderBottom: "1px solid var(--border-light, var(--subtle))",
    }}>
      {Icon && (
        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "var(--subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} style={{ color: c }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
        {subValue && <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{subValue}</div>}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: c, flexShrink: 0 }}>{value}</div>
    </div>
  );
}

/* ── Date filtering helpers ── */
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function filterByPeriod(rows, period, dateField = "date") {
  if (period === "all") return rows;
  const now = new Date();
  const todayStr = toDateStr(now);
  if (period === "today") {
    return rows.filter(r => {
      const d = r[dateField];
      return d && d.slice(0, 10) === todayStr;
    });
  }
  const cutoff = new Date(now);
  if (period === "week") cutoff.setDate(cutoff.getDate() - 7);
  if (period === "month") cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = toDateStr(cutoff);
  return rows.filter(r => {
    const d = r[dateField];
    return d && d.slice(0, 10) >= cutoffStr;
  });
}

/* ── Parse medications JSON safely ── */
function parseMedications(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return []; }
}

/* ── Format currency ── */
function fmtINR(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

/* ── Period selector component ── */
function PeriodSelector({ period, onChange }) {
  const options = [
    ["today", "Today"],
    ["week", "This Week"],
    ["month", "This Month"],
    ["all", "All Time"],
  ];
  return (
    <div className="no-print" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {options.map(([key, label]) => (
        <button
          key={key}
          className={`btn btn-sm ${period === key ? "btn-primary" : "btn-outline"}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    Promise.all([
      getHomeCarePatients(),
      getIncidents(),
      getVisitors(),
      getBilling(),
      getMedicines(),
      getMedSchedule(),
      getAppointments(),
      getPrescriptions(),
      getUsers(),
    ]).then(([pts, inc, vis, bill, meds, medSch, appts, rxs, usrs]) => {
      const arr = v => (Array.isArray(v) ? v : v?.data || []);
      setData({
        patients: arr(pts),
        incidents: arr(inc),
        visitors: arr(vis),
        billing: arr(bill).map(b => ({ ...b, amount: Number(b.amount) || 0 })),
        medicines: arr(meds).map(m => ({ ...m, stock: Number(m.stock) || 0, minStock: Number(m.minStock) || 0, price: Number(m.price) || 0 })),
        medSchedule: arr(medSch),
        appointments: arr(appts),
        prescriptions: arr(rxs),
        users: arr(usrs),
      });
    })
      .catch(() => setData({
        patients: [], incidents: [], visitors: [], billing: [],
        medicines: [], medSchedule: [], appointments: [], prescriptions: [], users: [],
      }))
      .finally(() => setLoading(false));
  }, []);

  /* ── Filtered datasets (memoised) ── */
  const filtered = useMemo(() => {
    if (!data) return null;
    return {
      billing: filterByPeriod(data.billing, period),
      appointments: filterByPeriod(data.appointments, period),
      prescriptions: filterByPeriod(data.prescriptions, period),
      incidents: filterByPeriod(data.incidents, period),
      visitors: filterByPeriod(data.visitors, period),
    };
  }, [data, period]);

  if (loading) return <div className="loading-box"><span className="spinner" /><span>Generating reports...</span></div>;
  if (!data) return null;

  const { patients, medicines, medSchedule, users } = data;
  const { billing, appointments, prescriptions, incidents, visitors } = filtered;

  /* ────────────────────────── Global calculations ────────────────────────── */
  const totalRevenue = billing.reduce((s, b) => s + b.amount, 0);
  const paidRevenue = billing.filter(b => b.status === "Paid").reduce((s, b) => s + b.amount, 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const lowStockMeds = medicines.filter(m => m.stock <= m.minStock);

  const incidentsByType = {};
  incidents.forEach(i => { incidentsByType[i.type] = (incidentsByType[i.type] || 0) + 1; });

  const totalMeds = medSchedule.flatMap(p => p.schedule || []);
  const medCompliance = totalMeds.length ? Math.round((totalMeds.filter(m => m.given).length / totalMeds.length) * 100) : 0;

  const condCounts = {};
  patients.forEach(p => {
    const cond = (p.condition || "Other").split(",")[0].trim();
    condCounts[cond] = (condCounts[cond] || 0) + 1;
  });

  const ageBuckets = { "60-69": 0, "70-79": 0, "80-89": 0, "90+": 0 };
  patients.forEach(p => {
    const age = p.age || 0;
    if (age >= 90) ageBuckets["90+"]++;
    else if (age >= 80) ageBuckets["80-89"]++;
    else if (age >= 70) ageBuckets["70-79"]++;
    else ageBuckets["60-69"]++;
  });

  /* ────────────────────────── Consultant fee analytics ────────────────────────── */
  const consultBilling = billing.filter(b => (b.type || "").toLowerCase().includes("consult"));
  const doctorMap = {};
  // Build from billing
  consultBilling.forEach(b => {
    const doc = b.doctor || "Unknown";
    if (!doctorMap[doc]) doctorMap[doc] = { patients: new Set(), totalFees: 0, count: 0 };
    doctorMap[doc].totalFees += b.amount;
    doctorMap[doc].count += 1;
    if (b.patientName) doctorMap[doc].patients.add(b.patientName);
  });
  // Supplement from appointments
  appointments.forEach(a => {
    const doc = a.doctor || "Unknown";
    if (!doctorMap[doc]) doctorMap[doc] = { patients: new Set(), totalFees: 0, count: 0 };
    if (a.patientName) doctorMap[doc].patients.add(a.patientName);
  });

  const doctorStats = Object.entries(doctorMap)
    .map(([name, d]) => {
      const user = users.find(u => u.name === name);
      return {
        name,
        specialization: user?.specialization || "-",
        patientsSeen: d.patients.size,
        totalFees: d.totalFees,
        avgFee: d.count ? Math.round(d.totalFees / d.count) : 0,
        count: d.count,
      };
    })
    .sort((a, b) => b.totalFees - a.totalFees);

  const totalConsultRevenue = doctorStats.reduce((s, d) => s + d.totalFees, 0);

  // Revenue by appointment type
  const apptTypeRevenue = {};
  billing.forEach(b => {
    const t = b.type || "Other";
    if (!apptTypeRevenue[t]) apptTypeRevenue[t] = { count: 0, revenue: 0 };
    apptTypeRevenue[t].count += 1;
    apptTypeRevenue[t].revenue += b.amount;
  });

  /* ────────────────────────── Medicine sales analytics ────────────────────────── */
  const medPrescribed = {};
  prescriptions.forEach(rx => {
    const meds = parseMedications(rx.medications);
    meds.forEach(med => {
      const name = (med.name || "").trim();
      if (!name) return;
      const qty = Number(med.qty) || 1;
      if (!medPrescribed[name]) medPrescribed[name] = { timesPrescribed: 0, totalQty: 0 };
      medPrescribed[name].timesPrescribed += 1;
      medPrescribed[name].totalQty += qty;
    });
  });

  const medSalesTable = Object.entries(medPrescribed)
    .map(([name, stats]) => {
      const medInfo = medicines.find(m => m.name === name);
      const price = medInfo?.price || 0;
      return {
        name,
        timesPrescribed: stats.timesPrescribed,
        totalQty: stats.totalQty,
        stockRemaining: medInfo ? medInfo.stock : "-",
        unit: medInfo?.unit || "",
        revenue: price * stats.totalQty,
        isLow: medInfo ? medInfo.stock <= medInfo.minStock : false,
      };
    })
    .sort((a, b) => b.timesPrescribed - a.timesPrescribed);

  const totalMedRevenue = medSalesTable.reduce((s, m) => s + m.revenue, 0);
  const maxPrescribed = medSalesTable.length ? medSalesTable[0].timesPrescribed : 0;

  /* ────────────────────────── Expiring medicines ────────────────────────── */
  const now = new Date();
  const thirtyDaysOut = new Date(now);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  const expiringMeds = medicines.filter(m => {
    const exp = parseDate(m.expiry);
    return exp && exp <= thirtyDaysOut;
  });

  /* ════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Key metrics and insights for care home management</p>
        </div>
      </div>

      {/* Print Header */}
      <div className="print-only" style={{ textAlign: "center", borderBottom: "2px solid #1a3558", paddingBottom: "10px", marginBottom: "14px" }}>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#1a3558" }}>Shanti Care Home — Management Report</div>
        <div style={{ fontSize: "11px", color: "#64748b" }}>
          Generated on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Tab Nav */}
      <div className="tab-bar no-print" style={{ marginBottom: "14px" }}>
        {[
          ["overview", "Overview"],
          ["consultants", "Consultant Fees"],
          ["medicine-sales", "Medicine Sales"],
          ["financial", "Financial"],
          ["safety", "Safety"],
          ["operations", "Operations"],
        ].map(([key, label]) => (
          <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Period Selector */}
      <div className="no-print" style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Calendar size={14} style={{ color: "var(--text-secondary)" }} />
        <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Period:</span>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      {/* ═══════════════════ OVERVIEW ═══════════════════ */}
      {tab === "overview" && (
        <>
          {/* Top stat cards with icons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "14px" }}>
            <MiniStatCard icon={BedDouble} value={patients.length} label="Total Residents" color="blue" />
            <MiniStatCard icon={IndianRupee} value={fmtINR(paidRevenue)} label="Revenue Collected" color="green" />
            <MiniStatCard icon={AlertTriangle} value={incidents.filter(i => i.status !== "Resolved").length} label="Open Incidents" color="red" />
            <MiniStatCard icon={Activity} value={`${medCompliance}%`} label="Med Compliance" color={medCompliance >= 90 ? "green" : "orange"} />
          </div>

          {/* Summary cards row with donut */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <MiniStatCard icon={Stethoscope} value={appointments.length} label="Appointments" color="teal" />
            <MiniStatCard icon={Pill} value={prescriptions.length} label="Prescriptions" color="purple" />
            <MiniStatCard icon={IndianRupee} value={fmtINR(totalRevenue)} label="Total Revenue" color="green" />
          </div>

          {/* Revenue donut + Age distribution */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div className="card">
              <div className="section-title"><Users size={13} style={{ marginRight: 4 }} /> Resident Age Distribution</div>
              <HBarChart
                items={Object.entries(ageBuckets).map(([bucket, count]) => ({
                  label: bucket + " years", value: count,
                }))}
                color="blue"
                maxOverride={patients.length}
              />
            </div>
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="section-title" style={{ alignSelf: "flex-start" }}><IndianRupee size={13} style={{ marginRight: 4 }} /> Revenue Breakdown</div>
              <div style={{ marginTop: "8px" }}>
                <DonutChart
                  segments={[
                    { label: "Paid", value: paidRevenue, color: "green", displayValue: fmtINR(paidRevenue) },
                    { label: "Pending", value: pendingRevenue, color: "red", displayValue: fmtINR(pendingRevenue) },
                  ]}
                  size={150}
                  centerValue={`${totalRevenue ? Math.round((paidRevenue / totalRevenue) * 100) : 0}%`}
                  centerLabel="collected"
                />
              </div>
            </div>
          </div>

          {/* Incidents by Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="card">
              <div className="section-title"><AlertTriangle size={13} style={{ marginRight: 4 }} /> Incidents by Type</div>
              {Object.keys(incidentsByType).length > 0 ? (
                <HBarChart
                  items={Object.entries(incidentsByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({
                    label: type, value: count,
                  }))}
                  color="red"
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-light)" }}>No incidents recorded</p>
              )}
            </div>
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="section-title" style={{ alignSelf: "flex-start" }}><Activity size={13} style={{ marginRight: 4 }} /> Med Compliance</div>
              <div style={{ marginTop: "8px" }}>
                <DonutChart
                  segments={[
                    { label: "Given", value: totalMeds.filter(m => m.given).length, color: "green" },
                    { label: "Pending", value: totalMeds.filter(m => !m.given).length, color: "orange" },
                  ]}
                  size={150}
                  centerValue={`${medCompliance}%`}
                  centerLabel="compliance"
                />
              </div>
            </div>
          </div>

          {/* Top doctors & medicines quick glance */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
            <div className="card">
              <div className="section-title"><Stethoscope size={13} style={{ marginRight: 4 }} /> Top Doctors by Revenue</div>
              {doctorStats.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {doctorStats.slice(0, 5).map((d, idx) => (
                    <MetricRow
                      key={d.name}
                      icon={Stethoscope}
                      label={d.name}
                      subValue={`${d.patientsSeen} patients`}
                      value={fmtINR(d.totalFees)}
                      color={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-light)" }}>No consultation data</p>
              )}
            </div>
            <div className="card">
              <div className="section-title"><Pill size={13} style={{ marginRight: 4 }} /> Most Prescribed Medicines</div>
              {medSalesTable.length > 0 ? (
                <HBarChart
                  items={medSalesTable.slice(0, 5).map(m => ({
                    label: m.name, value: m.timesPrescribed,
                  }))}
                  color="purple"
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-light)" }}>No prescription data</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ CONSULTANT FEES ═══════════════════ */}
      {tab === "consultants" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "14px" }}>
            <MiniStatCard icon={IndianRupee} value={fmtINR(totalConsultRevenue)} label="Total Consultation Revenue" color="blue" />
            <MiniStatCard icon={Stethoscope} value={doctorStats.length} label="Active Doctors" color="teal" />
            <MiniStatCard icon={Users} value={doctorStats.reduce((s, d) => s + d.patientsSeen, 0)} label="Patients Seen" color="green" />
            <MiniStatCard
              icon={Activity}
              value={fmtINR(doctorStats.length ? Math.round(totalConsultRevenue / doctorStats.reduce((s, d) => s + d.count, 0) || 0) : 0)}
              label="Avg Fee / Consultation"
              color="purple"
            />
          </div>

          {/* Revenue per doctor bar chart + billing type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="card">
              <div className="section-title"><Stethoscope size={13} style={{ marginRight: 4 }} /> Revenue per Doctor</div>
              {doctorStats.length > 0 ? (
                <HBarChart
                  items={doctorStats.map(d => ({ label: d.name, value: d.totalFees }))}
                  color="blue"
                  formatValue={fmtINR}
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-light)" }}>No consultation billing data</p>
              )}
            </div>
            <div className="card">
              <div className="section-title"><Activity size={13} style={{ marginRight: 4 }} /> Revenue by Billing Type</div>
              <HBarChart
                items={Object.entries(apptTypeRevenue)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([type, info]) => ({
                    label: `${type} (${info.count})`, value: info.revenue,
                  }))}
                color="purple"
                formatValue={fmtINR}
              />
            </div>
          </div>

          {/* Doctor detail table */}
          <div className="card" style={{ marginTop: "14px" }}>
            <div className="section-title"><Users size={13} style={{ marginRight: 4 }} /> Doctor Performance</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Patients Seen</th>
                    <th>Consultations</th>
                    <th>Total Fees</th>
                    <th>Avg Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorStats.map(d => (
                    <tr key={d.name}>
                      <td className="cell-name">{d.name}</td>
                      <td>{d.specialization}</td>
                      <td>{d.patientsSeen}</td>
                      <td>{d.count}</td>
                      <td style={{ fontWeight: 700, color: "var(--success)" }}>{fmtINR(d.totalFees)}</td>
                      <td>{fmtINR(d.avgFee)}</td>
                    </tr>
                  ))}
                  {doctorStats.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-light)" }}>No data available</td></tr>
                  )}
                </tbody>
                {doctorStats.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700, background: "var(--subtle)" }}>
                      <td>Total</td>
                      <td></td>
                      <td>{doctorStats.reduce((s, d) => s + d.patientsSeen, 0)}</td>
                      <td>{doctorStats.reduce((s, d) => s + d.count, 0)}</td>
                      <td style={{ color: "var(--success)" }}>{fmtINR(totalConsultRevenue)}</td>
                      <td>{fmtINR(doctorStats.length ? Math.round(totalConsultRevenue / doctorStats.reduce((s, d) => s + d.count, 0) || 0) : 0)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ MEDICINE SALES ═══════════════════ */}
      {tab === "medicine-sales" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "14px" }}>
            <MiniStatCard icon={Pill} value={medSalesTable.reduce((s, m) => s + m.timesPrescribed, 0)} label="Times Prescribed" color="purple" />
            <MiniStatCard icon={Package} value={medSalesTable.length} label="Unique Medicines" color="blue" />
            <MiniStatCard icon={IndianRupee} value={fmtINR(totalMedRevenue)} label="Medicine Revenue" color="green" />
            <MiniStatCard icon={AlertTriangle} value={lowStockMeds.length} label="Low Stock Alerts" color="red" />
          </div>

          {/* Most prescribed bar chart + revenue by medicine */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="card">
              <div className="section-title"><BarChart3 size={13} style={{ marginRight: 4 }} /> Most Prescribed Medicines</div>
              {medSalesTable.length > 0 ? (
                <HBarChart
                  items={medSalesTable.slice(0, 10).map(m => ({ label: m.name, value: m.timesPrescribed }))}
                  color="purple"
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-light)" }}>No prescription data</p>
              )}
            </div>
            <div className="card">
              <div className="section-title"><TrendingUp size={13} style={{ marginRight: 4 }} /> Revenue by Medicine</div>
              {medSalesTable.filter(m => m.revenue > 0).length > 0 ? (
                <HBarChart
                  items={medSalesTable.filter(m => m.revenue > 0).slice(0, 10).map(m => ({
                    label: m.name, value: m.revenue,
                  }))}
                  color="green"
                  formatValue={fmtINR}
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-light)" }}>No revenue data</p>
              )}
            </div>
          </div>

          {/* Low stock alerts */}
          {lowStockMeds.length > 0 && (
            <div className="alert-bar" style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={16} />
              <span><strong>{lowStockMeds.length}</strong> medicine(s) are below minimum stock levels.</span>
            </div>
          )}

          {/* Expiry alerts */}
          {expiringMeds.length > 0 && (
            <div className="alert-bar" style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Package size={16} />
              <span><strong>{expiringMeds.length}</strong> medicine(s) expiring within 30 days.</span>
            </div>
          )}

          {/* Medicine sales table */}
          <div className="card" style={{ marginTop: "14px" }}>
            <div className="section-title"><Pill size={13} style={{ marginRight: 4 }} /> Medicine Prescription & Sales Detail</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Times Prescribed</th>
                    <th>Total Qty</th>
                    <th>Stock Remaining</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medSalesTable.map(m => (
                    <tr key={m.name}>
                      <td className="cell-name">{m.name}</td>
                      <td>{m.timesPrescribed}</td>
                      <td>{m.totalQty} {m.unit}</td>
                      <td style={{ color: m.isLow ? "var(--danger)" : "var(--text)", fontWeight: m.isLow ? 700 : 400 }}>
                        {m.stockRemaining} {m.unit}
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--success)" }}>{fmtINR(m.revenue)}</td>
                      <td>
                        {m.isLow
                          ? <span className="badge badge-red">Low Stock</span>
                          : <span className="badge badge-green">OK</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {medSalesTable.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-light)" }}>No prescription data</td></tr>
                  )}
                </tbody>
                {medSalesTable.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700, background: "var(--subtle)" }}>
                      <td>Total</td>
                      <td>{medSalesTable.reduce((s, m) => s + m.timesPrescribed, 0)}</td>
                      <td>{medSalesTable.reduce((s, m) => s + m.totalQty, 0)}</td>
                      <td></td>
                      <td style={{ color: "var(--success)" }}>{fmtINR(totalMedRevenue)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ FINANCIAL ═══════════════════ */}
      {tab === "financial" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "14px" }}>
            <MiniStatCard icon={IndianRupee} value={fmtINR(totalRevenue)} label="Total Billed" color="blue" />
            <MiniStatCard icon={IndianRupee} value={fmtINR(paidRevenue)} label="Collected" color="green" />
            <MiniStatCard icon={IndianRupee} value={fmtINR(pendingRevenue)} label="Pending" color="red" />
            <MiniStatCard icon={TrendingUp} value={`${totalRevenue ? Math.round((paidRevenue / totalRevenue) * 100) : 0}%`} label="Collection Rate" color="teal" />
          </div>

          {/* Revenue breakdown summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div className="card" style={{ textAlign: "center", borderLeft: "4px solid #3b82f6", background: "linear-gradient(135deg, #3b82f608, #1d4ed812)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                Consultation Fees
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800 }}>{fmtINR(totalConsultRevenue)}</div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {totalRevenue ? Math.round((totalConsultRevenue / totalRevenue) * 100) : 0}% of total
              </div>
            </div>
            <div className="card" style={{ textAlign: "center", borderLeft: "4px solid #8b5cf6", background: "linear-gradient(135deg, #8b5cf608, #6d28d912)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                Medicine Revenue
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800 }}>{fmtINR(totalMedRevenue)}</div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                From {medSalesTable.length} medicines
              </div>
            </div>
            <div className="card" style={{ textAlign: "center", borderLeft: "4px solid #22c55e", background: "linear-gradient(135deg, #22c55e08, #16a34a12)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                Other Revenue
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800 }}>
                {fmtINR(Math.max(totalRevenue - totalConsultRevenue, 0))}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Non-consultation billing
              </div>
            </div>
          </div>

          {/* Revenue by type bar chart + donut */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div className="card">
              <div className="section-title"><BarChart3 size={13} style={{ marginRight: 4 }} /> Revenue by Category</div>
              <HBarChart
                items={Object.entries(apptTypeRevenue)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([type, info]) => ({ label: type, value: info.revenue }))}
                color="blue"
                formatValue={fmtINR}
              />
            </div>
            <div className="card">
              <div className="section-title"><TrendingUp size={13} style={{ marginRight: 4 }} /> Collection Status</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px" }}>
                <DonutChart
                  segments={[
                    { label: "Paid", value: paidRevenue, color: "green", displayValue: fmtINR(paidRevenue) },
                    { label: "Pending", value: pendingRevenue, color: "red", displayValue: fmtINR(pendingRevenue) },
                  ]}
                  size={130}
                  centerValue={`${totalRevenue ? Math.round((paidRevenue / totalRevenue) * 100) : 0}%`}
                  centerLabel="paid"
                />
              </div>
              <div style={{ padding: "10px", background: "var(--subtle)", borderRadius: "10px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 600 }}>Consultant Fees Breakdown</div>
                {doctorStats.slice(0, 5).map((d, idx) => (
                  <MetricRow
                    key={d.name}
                    icon={Stethoscope}
                    label={d.name}
                    value={fmtINR(d.totalFees)}
                    color={COLORS[idx % COLORS.length]}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Billing breakdown table */}
          <div className="card">
            <div className="section-title"><IndianRupee size={13} style={{ marginRight: 4 }} /> Billing Breakdown</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Category</th><th>Count</th><th>Amount</th><th>Paid</th><th>Pending</th><th>Collection %</th></tr>
                </thead>
                <tbody>
                  {[...new Set(billing.map(b => b.type || "Other"))].map(type => {
                    const items = billing.filter(b => (b.type || "Other") === type);
                    const total = items.reduce((s, b) => s + b.amount, 0);
                    const paid = items.filter(b => b.status === "Paid").reduce((s, b) => s + b.amount, 0);
                    const pct = total ? Math.round((paid / total) * 100) : 0;
                    return (
                      <tr key={type}>
                        <td className="cell-name">{type}</td>
                        <td>{items.length}</td>
                        <td>{fmtINR(total)}</td>
                        <td style={{ color: "var(--success)" }}>{fmtINR(paid)}</td>
                        <td style={{ color: "var(--danger)" }}>{fmtINR(total - paid)}</td>
                        <td>
                          <span
                            className={`badge ${pct >= 80 ? "badge-green" : pct >= 50 ? "badge-yellow" : "badge-red"}`}
                          >
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, background: "var(--subtle)" }}>
                    <td>Total</td>
                    <td>{billing.length}</td>
                    <td>{fmtINR(totalRevenue)}</td>
                    <td style={{ color: "var(--success)" }}>{fmtINR(paidRevenue)}</td>
                    <td style={{ color: "var(--danger)" }}>{fmtINR(pendingRevenue)}</td>
                    <td>
                      <span className={`badge ${totalRevenue ? (Math.round((paidRevenue / totalRevenue) * 100) >= 80 ? "badge-green" : "badge-yellow") : ""}`}>
                        {totalRevenue ? Math.round((paidRevenue / totalRevenue) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ SAFETY ═══════════════════ */}
      {tab === "safety" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "14px" }}>
            <MiniStatCard icon={AlertTriangle} value={incidents.length} label="Total Incidents" color="red" />
            <MiniStatCard icon={Activity} value={incidents.filter(i => i.status === "Resolved").length} label="Resolved" color="green" />
            <MiniStatCard icon={AlertTriangle} value={incidents.filter(i => i.status !== "Resolved").length} label="Open" color="orange" />
            <MiniStatCard icon={AlertTriangle} value={incidents.filter(i => i.severity === "High" || i.severity === "Critical").length} label="High/Critical" color="purple" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="card">
              <div className="section-title">By Type</div>
              {Object.keys(incidentsByType).length > 0 ? (
                <HBarChart
                  items={Object.entries(incidentsByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({
                    label: type, value: count,
                  }))}
                  color="red"
                />
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-light)" }}>No incidents recorded</p>
              )}
            </div>
            <div className="card">
              <div className="section-title">By Severity</div>
              <HBarChart
                items={["Critical", "High", "Moderate", "Low"].map(sev => ({
                  label: sev,
                  value: incidents.filter(i => i.severity === sev).length,
                }))}
                color="red"
                maxOverride={incidents.length || 1}
              />
              {incidents.length > 0 && (
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
                  <DonutChart
                    segments={["Critical", "High", "Moderate", "Low"]
                      .map((sev, idx) => ({
                        label: sev,
                        value: incidents.filter(i => i.severity === sev).length,
                        color: sev === "Critical" ? "red" : sev === "High" ? "orange" : sev === "Moderate" ? "blue" : "green",
                      }))
                      .filter(s => s.value > 0)}
                    size={130}
                    centerValue={incidents.length}
                    centerLabel="total"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ OPERATIONS ═══════════════════ */}
      {tab === "operations" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "14px" }}>
            <MiniStatCard icon={Activity} value={`${medCompliance}%`} label="Med Compliance" color="green" />
            <MiniStatCard icon={AlertTriangle} value={lowStockMeds.length} label="Low Stock Items" color="orange" />
            <MiniStatCard icon={Users} value={visitors.length} label="Total Visitors" color="blue" />
            <MiniStatCard icon={Users} value={users.filter(u => u.status === "Active" || u.status === "active").length} label="Active Staff" color="purple" />
          </div>

          {lowStockMeds.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ color: "var(--danger)" }}>
                <Pill size={13} style={{ marginRight: 4 }} /> Low Stock Alert
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Medicine</th><th>Category</th><th>Current Stock</th><th>Min Required</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {lowStockMeds.map(m => (
                      <tr key={m.id || m.name}>
                        <td className="cell-name">{m.name}</td>
                        <td>{m.category}</td>
                        <td style={{ color: "var(--danger)", fontWeight: 700 }}>{m.stock} {m.unit}</td>
                        <td>{m.minStock} {m.unit}</td>
                        <td><span className="badge badge-red">Low Stock</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: lowStockMeds.length > 0 ? "14px" : 0 }}>
            <div className="section-title">Medication Administration</div>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 auto" }}>
                <DonutChart
                  segments={[
                    { label: "Given", value: totalMeds.filter(m => m.given).length, color: "green" },
                    { label: "Pending", value: totalMeds.filter(m => !m.given).length, color: "orange" },
                  ]}
                  size={140}
                  centerValue={`${medCompliance}%`}
                  centerLabel="given"
                />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <MetricRow
                  icon={Activity}
                  label="Medications Given"
                  value={totalMeds.filter(m => m.given).length}
                  subValue={`of ${totalMeds.length} total`}
                  color="green"
                />
                <MetricRow
                  icon={AlertTriangle}
                  label="Medications Pending"
                  value={totalMeds.filter(m => !m.given).length}
                  subValue={totalMeds.length ? `${100 - medCompliance}% remaining` : "No data"}
                  color="orange"
                />
              </div>
            </div>
          </div>

          {/* Staff overview */}
          {users.length > 0 && (
            <div className="card" style={{ marginTop: "14px" }}>
              <div className="section-title"><Users size={13} style={{ marginRight: 4 }} /> Staff by Role</div>
              {(() => {
                const roleCounts = {};
                users.forEach(u => { roleCounts[u.role || "Other"] = (roleCounts[u.role || "Other"] || 0) + 1; });
                const entries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
                return (
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: "0 0 auto" }}>
                      <DonutChart
                        segments={entries.map(([role, count], idx) => ({
                          label: role, value: count,
                          color: COLORS[idx % COLORS.length],
                        }))}
                        size={140}
                        centerValue={users.length}
                        centerLabel="total staff"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <HBarChart
                        items={entries.map(([role, count]) => ({ label: role, value: count }))}
                        color="blue"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

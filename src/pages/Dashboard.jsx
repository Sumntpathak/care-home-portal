import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../api/sheets";
import {
  AlertTriangle, CalendarDays, Pill, BedDouble,
  Building, UserCheck, ArrowRightLeft, Heart, ClipboardList,
  BarChart3, Shield, Activity, UtensilsCrossed, Users, TrendingUp,
  Stethoscope, IndianRupee, FolderOpen, Siren, Clock, FileText, ChevronRight
} from "lucide-react";

const SB = { "Scheduled": "badge-blue", "With Doctor": "badge-yellow", "To Dispensary": "badge-purple", "Dispensed": "badge-green", "Completed": "badge-green" };

export default function Dashboard() {
  const { user, isAdmin, isDoctor, position } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard(user.role, user.name, user.position)
      .then(r => setStats(r.data || r))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="loading-box">
      <span className="spinner" />
      <span>Loading your dashboard...</span>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const occupancyPct = stats?.totalBeds ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0;

  return (
    <div className="fade-in">
      {/* Welcome Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-.03em", color: "var(--text)", marginBottom: "4px" }}>
              {greeting}, {(user.name || "").split(" ")[0]}
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>{dateStr}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {isAdmin && stats?.activeIncidents > 0 && (
              <button className="btn btn-sm" onClick={() => navigate("/incidents")}
                style={{ background: "var(--danger-light)", color: "var(--danger)", border: "1px solid rgba(212,104,90,.2)" }}>
                <Siren size={14} /> {stats.activeIncidents} Active Incident{stats.activeIncidents > 1 ? "s" : ""}
              </button>
            )}
            {isAdmin && stats?.lowStock > 0 && (
              <button className="btn btn-sm" onClick={() => navigate("/medicines")}
                style={{ background: "var(--warning-light)", color: "var(--warning)", border: "1px solid rgba(212,149,106,.2)" }}>
                <AlertTriangle size={14} /> {stats.lowStock} Low Stock
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ADMIN DASHBOARD ── */}
      {isAdmin && <>
        {/* Primary KPI Cards */}
        <div className="stat-grid stagger">
          <div className="stat-card" onClick={() => navigate("/patients")}>
            <div className="stat-icon" style={{ background: "var(--primary-light)" }}>
              <Users size={20} color="var(--primary)" />
            </div>
            <div className="label">Total Residents</div>
            <div className="val">{stats?.totalResidents ?? stats?.totalPatients ?? "—"}</div>
            <div className="sub" style={{ color: "var(--success)" }}>Active in care</div>
          </div>

          <div className="stat-card" onClick={() => navigate("/beds")}>
            <div className="stat-icon" style={{ background: "var(--accent-light)" }}>
              <Building size={20} color="var(--accent)" />
            </div>
            <div className="label">Bed Occupancy</div>
            <div className="val">
              {stats?.occupiedBeds ?? "—"}
              <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 500 }}>/{stats?.totalBeds ?? "—"}</span>
            </div>
            <div style={{ marginTop: "8px" }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${occupancyPct}%`,
                  background: occupancyPct > 90 ? "var(--danger)" : occupancyPct > 70 ? "var(--warning)" : "var(--success)"
                }} />
              </div>
              <div className="sub" style={{ marginTop: "4px", color: stats?.availableBeds === 0 ? "var(--danger)" : "var(--success)" }}>
                {stats?.availableBeds ?? "—"} beds available
              </div>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate("/appointments")}>
            <div className="stat-icon" style={{ background: "var(--accent2-light)" }}>
              <CalendarDays size={20} color="var(--accent2)" />
            </div>
            <div className="label">Today's Appointments</div>
            <div className="val">{stats?.todayAppointments ?? "—"}</div>
            <div className="sub">OPD consultations</div>
          </div>

          <div className="stat-card" onClick={() => navigate("/billing")}>
            <div className="stat-icon" style={{ background: "var(--accent3-light)" }}>
              <IndianRupee size={20} color="var(--accent3)" />
            </div>
            <div className="label">Revenue Today</div>
            <div className="val money">₹{stats?.revenue ? stats.revenue.toLocaleString("en-IN") : "0"}</div>
            <div className="sub">Collected today</div>
          </div>
        </div>

        {/* Secondary KPI Row */}
        <div className="stat-grid stagger" style={{ marginTop: "-4px" }}>
          {[
            { v: stats?.todayVisitors ?? 0, l: "Visitors Today", p: "/visitors", icon: <UserCheck size={16} />, color: "var(--info)" },
            { v: stats?.activeIncidents ?? 0, l: "Open Incidents", p: "/incidents", icon: <AlertTriangle size={16} />, color: "var(--danger)" },
            { v: stats?.lowStock ?? 0, l: "Low Stock Medicines", p: "/medicines", icon: <Pill size={16} />, color: "var(--warning)" },
            { v: stats?.pendingHandovers ?? 0, l: "Pending Handovers", p: "/shift-handover", icon: <ArrowRightLeft size={16} />, color: "var(--accent2)" },
          ].map((item, i) => (
            <div key={i} className="stat-card" onClick={() => navigate(item.p)} style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ color: item.color }}>{item.icon}</span>
                <span className="label" style={{ marginBottom: 0 }}>{item.l}</span>
              </div>
              <div className="val" style={{ fontSize: "22px" }}>{item.v}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            {[
              { icon: BedDouble, label: "Daily Care Notes", path: "/home-care", color: "var(--success)", bg: "var(--success-light)" },
              { icon: Pill, label: "Med Rounds", path: "/med-schedule", color: "var(--info)", bg: "var(--info-light)" },
              { icon: ClipboardList, label: "Care Plans", path: "/care-plans", color: "var(--purple)", bg: "var(--purple-light)" },
              { icon: FolderOpen, label: "Medical Files", path: "/medical-file", color: "var(--primary)", bg: "var(--primary-light)" },
              { icon: AlertTriangle, label: "Report Incident", path: "/incidents", color: "var(--danger)", bg: "var(--danger-light)" },
              { icon: UserCheck, label: "Visitor Log", path: "/visitors", color: "var(--accent3)", bg: "var(--accent3-light)" },
              { icon: ArrowRightLeft, label: "Shift Handover", path: "/shift-handover", color: "var(--accent2)", bg: "var(--accent2-light)" },
              { icon: Heart, label: "Family Updates", path: "/family-updates", color: "var(--danger)", bg: "var(--danger-light)" },
              { icon: UtensilsCrossed, label: "Dietary Plans", path: "/dietary", color: "var(--accent)", bg: "var(--accent-light)" },
              { icon: BarChart3, label: "Reports", path: "/reports", color: "var(--text-muted)", bg: "var(--subtle)" },
            ].map(({ icon: Icon, label, path, color, bg }) => (
              <button key={path} className="quick-action-btn" onClick={() => navigate(path)}>
                <div className="qa-icon" style={{ background: bg }}>
                  <Icon size={18} color={color} />
                </div>
                <span className="qa-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Flow */}
        <div className="card">
          <div className="card-header">
            <h3>OPD Patient Flow</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate("/appointments")}>
              View Queue <ChevronRight size={14} />
            </button>
          </div>
          <div className="workflow" style={{ padding: "8px 0" }}>
            {[
              { label: "Book Appointment", active: true },
              { label: "Create Bill" },
              { label: "With Doctor" },
              { label: "Prescription" },
              { label: "Dispensary" },
              { label: "Complete" },
            ].map((s, i) => (
              <span key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className={`wf-step${i === 0 ? " active" : ""}`}>
                  <span style={{ fontWeight: 700, marginRight: "4px", fontSize: "11px", opacity: .5 }}>{i + 1}</span>
                  {s.label}
                </span>
                {i < 5 && <span className="wf-arrow"><ChevronRight size={14} /></span>}
              </span>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        {stats?.todayList?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>Today's Appointments</h3>
              <button className="btn btn-outline btn-sm" onClick={() => navigate("/appointments")}>
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.todayList.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--text-muted)" }}>{a.receiptNo}</td>
                      <td className="cell-name">{a.patientName}</td>
                      <td style={{ fontSize: "13px" }}>{a.doctor}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{a.type}</td>
                      <td><span className={`badge ${SB[a.status] || "badge-gray"}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>}

      {/* ── DOCTOR DASHBOARD ── */}
      {isDoctor && <>
        <div className="stat-grid stagger">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--warning-light)" }}>
              <Clock size={20} color="var(--warning)" />
            </div>
            <div className="label">Waiting for Me</div>
            <div className="val">{stats?.myWaiting ?? "—"}</div>
            <div className="sub" style={{ color: "var(--warning)" }}>Patients in queue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--info-light)" }}>
              <CalendarDays size={20} color="var(--info)" />
            </div>
            <div className="label">Today's Total</div>
            <div className="val">{stats?.todayAppointments ?? "—"}</div>
            <div className="sub">Scheduled today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--primary-light)" }}>
              <FileText size={20} color="var(--primary)" />
            </div>
            <div className="label">My Prescriptions</div>
            <div className="val">{stats?.myRx ?? "—"}</div>
            <div className="sub">Total written</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate("/doctor-appointments")}>
              <div className="qa-icon" style={{ background: "var(--primary-light)" }}><Stethoscope size={18} color="var(--primary)" /></div>
              <span className="qa-label">My Patient Queue</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/medical-file")}>
              <div className="qa-icon" style={{ background: "var(--accent-light)" }}><FolderOpen size={18} color="var(--accent)" /></div>
              <span className="qa-label">Medical Files</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/care-plans")}>
              <div className="qa-icon" style={{ background: "var(--purple-light)" }}><ClipboardList size={18} color="var(--purple)" /></div>
              <span className="qa-label">Care Plans</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/incidents")}>
              <div className="qa-icon" style={{ background: "var(--danger-light)" }}><AlertTriangle size={18} color="var(--danger)" /></div>
              <span className="qa-label">Incidents</span>
            </button>
          </div>
        </div>
      </>}

      {/* ── STAFF DASHBOARDS ── */}
      {user.role === "Staff" && (position === "Appointment Desk" || position === "Receptionist") && (
        <div className="stat-grid stagger">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--info-light)" }}><CalendarDays size={20} color="var(--info)" /></div>
            <div className="label">Today's Appointments</div>
            <div className="val">{stats?.todayAppointments ?? "—"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--warning-light)" }}><IndianRupee size={20} color="var(--warning)" /></div>
            <div className="label">Pending Bills</div>
            <div className="val">{stats?.pendingBills ?? "—"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--accent-light)" }}><UserCheck size={20} color="var(--accent)" /></div>
            <div className="label">Visitors Today</div>
            <div className="val">{stats?.todayVisitors ?? "—"}</div>
          </div>
        </div>
      )}

      {user.role === "Staff" && position === "Dispensary" && (
        <div className="stat-grid stagger">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--warning-light)" }}><Pill size={20} color="var(--warning)" /></div>
            <div className="label">To Dispense</div>
            <div className="val">{stats?.pendingDispensary ?? "—"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--success-light)" }}><Pill size={20} color="var(--success)" /></div>
            <div className="label">Dispensed Today</div>
            <div className="val">{stats?.dispensedToday ?? "—"}</div>
          </div>
        </div>
      )}

      {user.role === "Staff" && position === "Home Care" && <>
        <div className="stat-grid stagger">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--primary-light)" }}><Users size={20} color="var(--primary)" /></div>
            <div className="label">Residents</div>
            <div className="val">{stats?.totalResidents ?? "—"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--danger-light)" }}><AlertTriangle size={20} color="var(--danger)" /></div>
            <div className="label">Open Incidents</div>
            <div className="val">{stats?.activeIncidents ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--accent2-light)" }}><ArrowRightLeft size={20} color="var(--accent2)" /></div>
            <div className="label">Pending Handovers</div>
            <div className="val">{stats?.pendingHandovers ?? 0}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate("/home-care")}>
              <div className="qa-icon" style={{ background: "var(--success-light)" }}><BedDouble size={18} color="var(--success)" /></div>
              <span className="qa-label">Daily Care</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/med-schedule")}>
              <div className="qa-icon" style={{ background: "var(--info-light)" }}><Pill size={18} color="var(--info)" /></div>
              <span className="qa-label">Med Rounds</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/shift-handover")}>
              <div className="qa-icon" style={{ background: "var(--accent2-light)" }}><ArrowRightLeft size={18} color="var(--accent2)" /></div>
              <span className="qa-label">Handover</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/incidents")}>
              <div className="qa-icon" style={{ background: "var(--danger-light)" }}><AlertTriangle size={18} color="var(--danger)" /></div>
              <span className="qa-label">Report Incident</span>
            </button>
          </div>
        </div>
      </>}
      {/* ── Clinical Safety Standards ── */}
      {isAdmin && (
        <div className="card" style={{marginTop: 4}}>
          <div className="card-header">
            <h3 style={{display:"flex",alignItems:"center",gap:6}}>
              <Shield size={15} style={{color:"var(--primary)"}}/> Safety Assistants — Error Catching Tools
            </h3>
            <span className="badge badge-green">All Systems Verified</span>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:10}}>
            {/* Vitals Analysis */}
            <div style={{background:"var(--subtle)",borderRadius:8,padding:14,border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <Activity size={14} style={{color:"var(--primary)"}}/>
                <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Vitals Monitoring</span>
              </div>
              <div style={{fontSize:11,color:"var(--text-secondary)",lineHeight:1.7}}>
                <div><strong style={{color:"var(--text)"}}>BP:</strong> AHA/JNC-8 with age-adjusted targets (≥60: under 150/90)</div>
                <div><strong style={{color:"var(--text)"}}>Glucose:</strong> ADA 2024 — hypoglycemic tachycardia correlation</div>
                <div><strong style={{color:"var(--text)"}}>SpO₂:</strong> WHO — CKD/HF fluid overload detection</div>
                <div><strong style={{color:"var(--text)"}}>Cross-vital:</strong> qSOFA sepsis screening, cardiorenal syndrome Type 5</div>
                <div><strong style={{color:"var(--text)"}}>Safety:</strong> Over-medication detection (elderly low BP + bradycardia)</div>
              </div>
              <div style={{marginTop:8,fontSize:10,color:"var(--text-muted)"}}>
                Condition-aware analysis · Linear regression trending · R² confidence scoring
              </div>
            </div>

            {/* Drug Interactions */}
            <div style={{background:"var(--subtle)",borderRadius:8,padding:14,border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <Pill size={14} style={{color:"var(--danger)"}}/>
                <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Drug Safety Assistant</span>
              </div>
              <div style={{fontSize:11,color:"var(--text-secondary)",lineHeight:1.7}}>
                <div><strong style={{color:"var(--text)"}}>Pass 1:</strong> Direct rule-based (40+ FDA interaction rules)</div>
                <div><strong style={{color:"var(--text)"}}>Pass 2:</strong> CYP450 metabolic (90+ drug profiles, 5 enzymes)</div>
                <div><strong style={{color:"var(--text)"}}>Pass 3:</strong> Transporters — P-gp, OATP1B1/1B3 (45+ profiles)</div>
                <div><strong style={{color:"var(--text)"}}>Pass 4:</strong> Opposing Forces detection (inducer vs inhibitor conflicts)</div>
                <div><strong style={{color:"var(--text)"}}>Pass 5:</strong> QT Prolongation synergy (17 QT-risk drugs, TdP alert)</div>
              </div>
              <div style={{marginTop:8,fontSize:10,color:"var(--text-muted)"}}>
                100+ Indian brand mappings · Duplicate therapy · Allergy cross-reactivity · qSOFA sepsis screening
              </div>
            </div>

            {/* Diet Advisory */}
            <div style={{background:"var(--subtle)",borderRadius:8,padding:14,border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <UtensilsCrossed size={14} style={{color:"var(--success)"}}/>
                <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Diet Suggestion Assistant</span>
              </div>
              <div style={{fontSize:11,color:"var(--text-secondary)",lineHeight:1.7}}>
                <div><strong style={{color:"var(--text)"}}>Diabetic:</strong> ADA MNT — glycemic index aware</div>
                <div><strong style={{color:"var(--text)"}}>Renal:</strong> KDIGO — leaching, K+/PO4 limits</div>
                <div><strong style={{color:"var(--text)"}}>Hepatic:</strong> Cirrhosis — BCAA priority, protein paradox resolution</div>
                <div><strong style={{color:"var(--text)"}}>Gout:</strong> Low-purine — DASH/Gout conflict resolution</div>
                <div><strong style={{color:"var(--text)"}}>Parkinson's:</strong> Protein redistribution for Levodopa timing</div>
              </div>
              <div style={{marginTop:8,fontSize:10,color:"var(--text-muted)"}}>
                14 condition profiles · Priority-based merge (CKD > Gout > Diabetes) · Fuzzy matching + Hindi terms
              </div>
            </div>

            {/* Handover */}
            <div style={{background:"var(--subtle)",borderRadius:8,padding:14,border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <ArrowRightLeft size={14} style={{color:"var(--accent2)"}}/>
                <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Handover Checklist Assistant</span>
              </div>
              <div style={{fontSize:11,color:"var(--text-secondary)",lineHeight:1.7}}>
                <div><strong style={{color:"var(--text)"}}>Framework:</strong> ISBAR (NHS Best Practice)</div>
                <div><strong style={{color:"var(--text)"}}>Alert Thresholds:</strong> WHO/AHA clinical ranges</div>
                <div><strong style={{color:"var(--text)"}}>Med Compliance:</strong> Real-time tracking</div>
                <div><strong style={{color:"var(--text)"}}>Patient Status:</strong> Multi-factor assessment</div>
                <div><strong style={{color:"var(--text)"}}>Shift Tasks:</strong> Evidence-based nursing protocols</div>
              </div>
              <div style={{marginTop:8,fontSize:10,color:"var(--text-muted)"}}>
                Auto-generates from actual care data — no manual input needed
              </div>
            </div>
          </div>

          <div style={{marginTop:12,padding:"10px 14px",background:"var(--info-light)",borderRadius:8,fontSize:11,color:"var(--info)",display:"flex",alignItems:"center",gap:8}}>
            <Shield size={14}/>
            <span>These are safety assistants that help catch errors — they do not diagnose, prescribe, or replace clinical consultation. All suggestions must be independently verified by a qualified doctor. The treating physician retains full responsibility. Standards are referenced for data thresholds only — not endorsed by any organization. Classified as CDSS under MDR 2017 (not a Medical Device).</span>
          </div>
        </div>
      )}
    </div>
  );
}

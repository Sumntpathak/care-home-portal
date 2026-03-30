import { useState, useEffect, useCallback, useMemo } from "react";
import { getDutyRoster, getUsers, getStaffActivity } from "../api/sheets";
import {
  Printer, RefreshCw, ChevronLeft, ChevronRight, Wand2, Calendar,
  Users as UsersIcon, UserCheck, UserX, ShieldCheck, Clock, Activity,
  ChevronDown, ChevronUp, AlertTriangle, ArrowRightLeft, X, Check
} from "lucide-react";
import { printFullPage } from "../print";
import { useToast } from "../components/Toast";

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const SHIFTS = [
  { key: "Morning",   label: "Morning",   time: "7 AM – 3 PM",   hours: [7, 15] },
  { key: "Afternoon", label: "Afternoon", time: "3 PM – 11 PM",  hours: [15, 23] },
  { key: "Night",     label: "Night",     time: "11 PM – 7 AM",  hours: [23, 7] },
];

const ROLE_COLORS = {
  Doctor:      { bg: "var(--success)",  text: "#fff" },
  Nurse:       { bg: "var(--info)",     text: "#fff" },
  "Home Care": { bg: "var(--info)",     text: "#fff" },
  Admin:       { bg: "var(--purple)",   text: "#fff" },
  Reception:   { bg: "var(--warning)",  text: "#fff" },
  "Appointment Desk": { bg: "var(--warning)", text: "#fff" },
  Dispensary:  { bg: "var(--danger)",   text: "#fff" },
  Lab:         { bg: "#6366f1",         text: "#fff" },
  General:     { bg: "#64748b",         text: "#fff" },
};

const SHIFT_COLORS = {
  Morning:   { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", icon: "☀️" },
  Afternoon: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", icon: "🌤️" },
  Night:     { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6", icon: "🌙" },
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ═══════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════ */
function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateShort(d) {
  return `${d.getDate()} ${d.toLocaleDateString("en-IN", { month: "short" })}`;
}

function isToday(d) {
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

function parseHour(timeStr) {
  if (!timeStr) return null;
  const parts = String(timeStr).split(":");
  return parseInt(parts[0], 10);
}

function getShiftForUser(user) {
  const start = parseHour(user.shiftStart);
  const end = parseHour(user.shiftEnd);
  if (start === null) return "Morning";
  if (start >= 7 && start < 15) return "Morning";
  if (start >= 15 && start < 23) return "Afternoon";
  return "Night";
}

function getRoleColor(position, role) {
  if (ROLE_COLORS[position]) return ROLE_COLORS[position];
  if (ROLE_COLORS[role]) return ROLE_COLORS[role];
  return { bg: "#64748b", text: "#fff" };
}

function getPositionLabel(user) {
  return user.position || user.role || "Staff";
}

/* ═══════════════════════════════════════════
   AUTO-GENERATE ALGORITHM
   ═══════════════════════════════════════════ */
function autoGenerate(users, weekDates) {
  const activeUsers = users.filter(u => (u.status || "Active") === "Active");
  const roster = {};
  const weeklyCount = {};
  const daysOff = {};

  activeUsers.forEach(u => {
    weeklyCount[u.name] = 0;
    daysOff[u.name] = [];
  });

  // Assign 2 consecutive days off per staff member
  activeUsers.forEach((u, idx) => {
    const offStart = idx % 6; // rotate starting day off
    daysOff[u.name] = [offStart, (offStart + 1) % 7];
  });

  weekDates.forEach((date, dayIdx) => {
    const dateStr = fmtDate(date);

    SHIFTS.forEach(shift => {
      const key = `${dateStr}-${shift.key}`;
      roster[key] = [];

      // Find staff whose preferred shift matches and who aren't off
      const available = activeUsers.filter(u => {
        if (daysOff[u.name]?.includes(dayIdx)) return false;
        if (weeklyCount[u.name] >= 5) return false;
        return getShiftForUser(u) === shift.key;
      });

      // Assign preferred shift staff
      available.forEach(u => {
        roster[key].push({ ...u, assigned: true });
        weeklyCount[u.name] = (weeklyCount[u.name] || 0) + 1;
      });

      // Ensure minimum coverage: at least 1 Home Care per shift
      const hasHomeCare = roster[key].some(s => s.position === "Home Care");
      if (!hasHomeCare) {
        const hcCandidate = activeUsers.find(u =>
          u.position === "Home Care" &&
          !daysOff[u.name]?.includes(dayIdx) &&
          weeklyCount[u.name] < 5 &&
          !roster[key].some(s => s.name === u.name)
        );
        if (hcCandidate) {
          roster[key].push({ ...hcCandidate, assigned: true, extra: true });
          weeklyCount[hcCandidate.name]++;
        }
      }

      // Ensure at least 1 Doctor during Morning/Afternoon
      if (shift.key !== "Night") {
        const hasDoctor = roster[key].some(s => s.role === "Doctor");
        if (!hasDoctor) {
          const drCandidate = activeUsers
            .filter(u => u.role === "Doctor" && !daysOff[u.name]?.includes(dayIdx) && weeklyCount[u.name] < 5 && !roster[key].some(s => s.name === u.name))
            .sort((a, b) => (weeklyCount[a.name] || 0) - (weeklyCount[b.name] || 0))[0];
          if (drCandidate) {
            roster[key].push({ ...drCandidate, assigned: true, extra: true });
            weeklyCount[drCandidate.name]++;
          }
        }
      }
    });
  });

  return roster;
}

/* ═══════════════════════════════════════════
   FIND REPLACEMENT
   ═══════════════════════════════════════════ */
function findReplacement(absentStaff, dateStr, shift, roster, users, absences) {
  const activeUsers = users.filter(u => (u.status || "Active") === "Active" && u.name !== absentStaff.name);

  // Count shifts this week for fairness
  const shiftCounts = {};
  activeUsers.forEach(u => { shiftCounts[u.name] = 0; });
  Object.values(roster).forEach(staffList => {
    (staffList || []).forEach(s => {
      if (shiftCounts[s.name] !== undefined) shiftCounts[s.name]++;
    });
  });

  // Check who is already assigned to the same day (any shift)
  const dayAssigned = new Set();
  SHIFTS.forEach(s => {
    const key = `${dateStr}-${s.key}`;
    (roster[key] || []).forEach(st => dayAssigned.add(st.name));
  });

  // Candidates: not absent, not already assigned that day
  const candidates = activeUsers.filter(u => {
    if (absences.has(`${dateStr}-${u.name}`)) return false;
    if (dayAssigned.has(u.name)) return false;
    return true;
  });

  // Score: same position > same role > other, then fewer shifts = better
  const scored = candidates.map(u => {
    let score = 0;
    if (u.position === absentStaff.position) score += 100;
    else if (u.role === absentStaff.role) score += 50;
    score -= (shiftCounts[u.name] || 0) * 2; // fewer shifts = higher score
    return { user: u, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.length > 0 ? scored[0].user : null;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function DutyRoster() {
  const { addToast } = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [rosterData, setRosterData] = useState({});
  const [absences, setAbsences] = useState(new Set());
  const [replacements, setReplacements] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null); // { staff, dateStr, shift }
  const [generated, setGenerated] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const weekLabel = useMemo(() => {
    const s = weekDates[0];
    const e = weekDates[6];
    return `${fmtDateShort(s)} – ${fmtDateShort(e)}, ${e.getFullYear()}`;
  }, [weekDates]);

  const todayStr = fmtDate(new Date());

  /* ── Load data ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rosterRes, usersRes, actRes] = await Promise.all([
        getDutyRoster(),
        getUsers(),
        getStaffActivity(),
      ]);
      const rosterArr = Array.isArray(rosterRes) ? rosterRes : rosterRes?.data || [];
      const usersArr = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
      const actArr = Array.isArray(actRes) ? actRes : actRes?.data || [];
      setAllUsers(usersArr);
      setActivityLog(actArr);

      // If no roster generated yet, don't auto-populate
      if (!generated) {
        setRosterData({});
      }
    } catch {
      setAllUsers([]);
      setActivityLog([]);
      addToast("Failed to load duty roster.", "error");
    } finally {
      setLoading(false);
    }
  }, [generated]);

  useEffect(() => { load(); }, [load]);

  /* ── Auto-generate handler ── */
  const handleAutoGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const newRoster = autoGenerate(allUsers, weekDates);
      setRosterData(newRoster);
      setAbsences(new Set());
      setReplacements({});
      setGenerated(true);
      setGenerating(false);
    }, 600);
  };

  /* ── Absence handler ── */
  const handleMarkAbsent = (staff, dateStr, shiftKey) => {
    const absKey = `${dateStr}-${staff.name}`;
    const newAbsences = new Set(absences);
    newAbsences.add(absKey);
    setAbsences(newAbsences);

    // Find replacement
    const replacement = findReplacement(staff, dateStr, shiftKey, rosterData, allUsers, newAbsences);
    if (replacement) {
      setReplacements(prev => ({ ...prev, [absKey]: replacement }));
      // Add replacement to the roster
      const rKey = `${dateStr}-${shiftKey}`;
      setRosterData(prev => ({
        ...prev,
        [rKey]: [...(prev[rKey] || []), { ...replacement, isReplacement: true, replacing: staff.name }],
      }));
    }
    setSelectedStaff(null);
  };

  const handleRemoveAbsence = (staff, dateStr, shiftKey) => {
    const absKey = `${dateStr}-${staff.name}`;
    const newAbsences = new Set(absences);
    newAbsences.delete(absKey);
    setAbsences(newAbsences);

    // Remove replacement from roster
    const rep = replacements[absKey];
    if (rep) {
      const rKey = `${dateStr}-${shiftKey}`;
      setRosterData(prev => ({
        ...prev,
        [rKey]: (prev[rKey] || []).filter(s => !(s.isReplacement && s.replacing === staff.name)),
      }));
      setReplacements(prev => {
        const n = { ...prev };
        delete n[absKey];
        return n;
      });
    }
    setSelectedStaff(null);
  };

  /* ── Stats ── */
  const stats = useMemo(() => {
    const totalStaff = allUsers.filter(u => (u.status || "Active") === "Active").length;
    let onDutyToday = 0;
    SHIFTS.forEach(s => {
      const key = `${todayStr}-${s.key}`;
      const staff = rosterData[key] || [];
      onDutyToday += staff.filter(st => !absences.has(`${todayStr}-${st.name}`)).length;
    });
    const absenceCount = absences.size;

    // Coverage score: percentage of shifts with adequate staffing
    let totalShifts = 0;
    let coveredShifts = 0;
    weekDates.forEach(date => {
      const ds = fmtDate(date);
      SHIFTS.forEach(s => {
        totalShifts++;
        const key = `${ds}-${s.key}`;
        const staff = (rosterData[key] || []).filter(st => !absences.has(`${ds}-${st.name}`));
        if (staff.length > 0) coveredShifts++;
      });
    });
    const coverage = totalShifts > 0 ? Math.round((coveredShifts / totalShifts) * 100) : 0;

    return { totalStaff, onDutyToday, absenceCount, coverage };
  }, [allUsers, rosterData, absences, todayStr, weekDates]);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div className="fade-in">
      {/* ── Print Header ── */}
      <div className="print-only" style={{
        textAlign: "center", borderBottom: "2px solid #1a3558",
        paddingBottom: 10, marginBottom: 14
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1a3558" }}>Shanti Care Home</div>
        <div style={{ fontSize: 11, color: "#64748b" }}>123 Serenity Lane &middot; Ph: +91-98765-43210</div>
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 6,
          fontSize: 11, borderTop: "1px solid #e2e8f0", paddingTop: 6
        }}>
          <strong>WEEKLY DUTY ROSTER</strong>
          <span>{weekLabel}</span>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className="page-header no-print">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={22} /> Duty Roster
          </h2>
          <p>Weekly staff scheduling &amp; absence management</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "var(--primary)", color: "#fff", border: "none" }}
            onClick={handleAutoGenerate}
            disabled={generating || allUsers.length === 0}
          >
            <Wand2 size={13} /> {generating ? "Generating..." : "Auto Generate"}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => printFullPage()}>
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14, marginBottom: 18
      }}>
        {[
          {
            label: "Total Staff", value: stats.totalStaff,
            icon: <UsersIcon size={20} />, color: "var(--primary)",
            bg: "var(--subtle)"
          },
          {
            label: "On Duty Today", value: stats.onDutyToday,
            icon: <UserCheck size={20} />, color: "var(--success)",
            bg: "var(--subtle)"
          },
          {
            label: "Absences This Week", value: stats.absenceCount,
            icon: <UserX size={20} />, color: "var(--danger)",
            bg: "var(--subtle)"
          },
          {
            label: "Coverage Score", value: `${stats.coverage}%`,
            icon: <ShieldCheck size={20} />, color: stats.coverage >= 80 ? "var(--success)" : stats.coverage >= 50 ? "var(--warning)" : "var(--danger)",
            bg: stats.coverage >= 80 ? "var(--subtle)" : stats.coverage >= 50 ? "var(--subtle)" : "var(--subtle)"
          },
        ].map((card, i) => (
          <div key={i} className="card" style={{
            padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
            borderLeft: `3px solid ${card.color}`, margin: 0
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, background: card.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: card.color, flexShrink: 0
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1.1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, marginTop: 2 }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Week Navigator ── */}
      <div className="card no-print" style={{
        padding: "12px 18px", marginBottom: 16, display: "flex",
        alignItems: "center", justifyContent: "space-between"
      }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setWeekOffset(w => w - 1)}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <ChevronLeft size={15} /> Prev Week
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
            {weekLabel}
          </div>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              style={{
                background: "none", border: "none", color: "var(--primary)",
                fontSize: 11, cursor: "pointer", textDecoration: "underline", marginTop: 2
              }}
            >
              Go to current week
            </button>
          )}
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setWeekOffset(w => w + 1)}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          Next Week <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <span className="spinner" />
          <p style={{ marginTop: 12, color: "var(--text-muted)" }}>Loading roster data...</p>
        </div>
      ) : !generated ? (
        /* ── Empty State ── */
        <div className="card" style={{
          padding: "60px 20px", textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "var(--subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", color: "var(--primary)"
          }}>
            <Calendar size={28} />
          </div>
          <h3 style={{ marginBottom: 8, color: "var(--text)" }}>No Roster Generated</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 400, margin: "0 auto 20px" }}>
            Click the "Auto Generate" button to create an optimized weekly roster
            for {allUsers.filter(u => u.status === "Active").length} active staff members.
          </p>
          <button
            className="btn"
            style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "10px 28px" }}
            onClick={handleAutoGenerate}
            disabled={generating || allUsers.length === 0}
          >
            <Wand2 size={15} /> Generate Weekly Roster
          </button>
        </div>
      ) : (
        /* ── Weekly Calendar Grid ── */
        <>
          {/* Role Legend */}
          <div className="no-print" style={{
            display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14
          }}>
            {Object.entries(ROLE_COLORS).filter(([k]) => !["Nurse", "Appointment Desk"].includes(k)).map(([role, c]) => (
              <div key={role} style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 11
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: c.bg, display: "inline-block"
                }} />
                <span style={{ color: "var(--text-secondary)" }}>{role}</span>
              </div>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "110px repeat(7, 1fr)",
              gap: 0, minWidth: 900,
              border: "1px solid var(--border)",
              borderRadius: 10, overflow: "hidden",
              background: "var(--surface)"
            }}>
              {/* Header Row */}
              <div style={{
                padding: "10px 12px", fontWeight: 700, fontSize: 11,
                background: "var(--surface)", borderBottom: "2px solid var(--border)",
                color: "var(--text-muted)", display: "flex", alignItems: "center"
              }}>
                SHIFT
              </div>
              {weekDates.map((date, di) => {
                const isTd = isToday(date);
                return (
                  <div key={di} style={{
                    padding: "8px 10px", textAlign: "center",
                    background: isTd ? "rgba(59,130,246,0.06)" : "var(--surface)",
                    borderBottom: "2px solid var(--border)",
                    borderLeft: "1px solid var(--border)"
                  }}>
                    <div style={{
                      fontWeight: 700, fontSize: 12,
                      color: isTd ? "var(--primary)" : "var(--text)"
                    }}>
                      {DAY_NAMES[di]}
                    </div>
                    <div style={{
                      fontSize: 11, color: "var(--text-muted)", marginTop: 1
                    }}>
                      {fmtDateShort(date)}
                    </div>
                    {isTd && (
                      <div style={{
                        fontSize: 9, background: "var(--primary)", color: "#fff",
                        borderRadius: 4, padding: "1px 6px", marginTop: 3,
                        display: "inline-block", fontWeight: 600
                      }}>
                        TODAY
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Shift Rows */}
              {SHIFTS.map((shift) => (
                <>
                  {/* Shift Label */}
                  <div key={`label-${shift.key}`} style={{
                    padding: "10px 12px",
                    background: SHIFT_COLORS[shift.key].bg,
                    borderBottom: "1px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                    display: "flex", flexDirection: "column", justifyContent: "center"
                  }}>
                    <div style={{
                      fontWeight: 700, fontSize: 12,
                      color: SHIFT_COLORS[shift.key].text,
                      display: "flex", alignItems: "center", gap: 5
                    }}>
                      <span>{SHIFT_COLORS[shift.key].icon}</span>
                      {shift.label}
                    </div>
                    <div style={{
                      fontSize: 10, color: SHIFT_COLORS[shift.key].text,
                      opacity: 0.7, marginTop: 2
                    }}>
                      {shift.time}
                    </div>
                  </div>

                  {/* Day Cells */}
                  {weekDates.map((date, di) => {
                    const dateStr = fmtDate(date);
                    const rKey = `${dateStr}-${shift.key}`;
                    const staffList = rosterData[rKey] || [];
                    const isTd = isToday(date);

                    return (
                      <div key={`${shift.key}-${di}`} style={{
                        padding: "6px 6px",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        background: isTd ? "rgba(59,130,246,0.03)" : "transparent",
                        minHeight: 60, display: "flex",
                        flexDirection: "column", gap: 3
                      }}>
                        {staffList.length === 0 ? (
                          <div style={{
                            fontSize: 10, color: "var(--text-muted)",
                            textAlign: "center", padding: "12px 0", opacity: 0.5
                          }}>
                            No staff
                          </div>
                        ) : (
                          staffList.map((staff, si) => {
                            const absKey = `${dateStr}-${staff.name}`;
                            const isAbsent = absences.has(absKey);
                            const isRep = staff.isReplacement;
                            const roleColor = getRoleColor(staff.position, staff.role);

                            return (
                              <div
                                key={si}
                                onClick={() => {
                                  if (!isRep) {
                                    setSelectedStaff({ staff, dateStr, shift: shift.key });
                                  }
                                }}
                                style={{
                                  padding: "4px 7px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: isRep ? "default" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  background: isAbsent
                                    ? "var(--subtle)"
                                    : isRep
                                      ? "var(--subtle)"
                                      : roleColor.bg + "18",
                                  border: `1px solid ${isAbsent ? "var(--danger)" : isRep ? "var(--success)" : roleColor.bg + "40"}`,
                                  color: isAbsent ? "var(--danger)" : isRep ? "var(--success)" : "var(--text)",
                                  textDecoration: isAbsent ? "line-through" : "none",
                                  opacity: isAbsent ? 0.7 : 1,
                                  transition: "all 0.15s ease",
                                  position: "relative",
                                  lineHeight: 1.3,
                                }}
                              >
                                <span style={{
                                  width: 6, height: 6, borderRadius: "50%",
                                  background: isAbsent ? "var(--danger)" : isRep ? "var(--success)" : roleColor.bg,
                                  flexShrink: 0
                                }} />
                                <span style={{
                                  overflow: "hidden", textOverflow: "ellipsis",
                                  whiteSpace: "nowrap", flex: 1
                                }}>
                                  {staff.name.split(" ").slice(0, 2).join(" ")}
                                </span>
                                {isAbsent && (
                                  <span style={{
                                    fontSize: 8, background: "var(--danger)",
                                    color: "#fff", borderRadius: 3, padding: "0 3px",
                                    fontWeight: 700, flexShrink: 0
                                  }}>
                                    ABS
                                  </span>
                                )}
                                {isRep && (
                                  <span style={{
                                    fontSize: 8, background: "var(--success)",
                                    color: "#fff", borderRadius: 3, padding: "0 3px",
                                    fontWeight: 700, flexShrink: 0
                                  }}>
                                    SUB
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Absence Dialog ── */}
      {selectedStaff && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20
        }} onClick={() => setSelectedStaff(null)}>
          <div style={{
            background: "var(--surface)", borderRadius: 14,
            padding: "24px 28px", maxWidth: 420, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 16
            }}>
              <h3 style={{ fontSize: 16, margin: 0, color: "var(--text)" }}>
                Staff Action
              </h3>
              <button
                onClick={() => setSelectedStaff(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", padding: 4
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              padding: "12px 14px", background: "rgba(59,130,246,0.05)",
              borderRadius: 8, marginBottom: 16
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                {selectedStaff.staff.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {getPositionLabel(selectedStaff.staff)} &middot; {selectedStaff.shift} Shift
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {new Date(selectedStaff.dateStr + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long"
                })}
              </div>
            </div>

            {absences.has(`${selectedStaff.dateStr}-${selectedStaff.staff.name}`) ? (
              <>
                <div style={{
                  padding: "10px 12px", background: "rgba(239,68,68,0.06)",
                  borderRadius: 8, marginBottom: 12, fontSize: 12,
                  display: "flex", alignItems: "center", gap: 8, color: "var(--danger)"
                }}>
                  <AlertTriangle size={15} />
                  <span>Currently marked as <strong>Absent</strong></span>
                </div>
                {replacements[`${selectedStaff.dateStr}-${selectedStaff.staff.name}`] && (
                  <div style={{
                    padding: "10px 12px", background: "rgba(16,185,129,0.06)",
                    borderRadius: 8, marginBottom: 12, fontSize: 12,
                    display: "flex", alignItems: "center", gap: 8,
                    color: "var(--success)"
                  }}>
                    <ArrowRightLeft size={15} />
                    <span>
                      Replaced by: <strong>
                        {replacements[`${selectedStaff.dateStr}-${selectedStaff.staff.name}`].name}
                      </strong>
                    </span>
                  </div>
                )}
                <button
                  className="btn"
                  style={{
                    width: "100%", background: "var(--success)", color: "#fff",
                    border: "none", padding: "10px 0", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: 8
                  }}
                  onClick={() => handleRemoveAbsence(
                    selectedStaff.staff, selectedStaff.dateStr, selectedStaff.shift
                  )}
                >
                  <Check size={15} /> Restore to Duty
                </button>
              </>
            ) : (
              <>
                {(() => {
                  const potentialRep = findReplacement(
                    selectedStaff.staff, selectedStaff.dateStr, selectedStaff.shift,
                    rosterData, allUsers, absences
                  );
                  return (
                    <>
                      {potentialRep && (
                        <div style={{
                          padding: "10px 12px", background: "rgba(16,185,129,0.06)",
                          borderRadius: 8, marginBottom: 12, fontSize: 12,
                          color: "var(--success)"
                        }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 6, marginBottom: 4
                          }}>
                            <ArrowRightLeft size={14} />
                            <strong>Suggested Replacement</strong>
                          </div>
                          <div style={{ marginLeft: 20 }}>
                            {potentialRep.name} ({getPositionLabel(potentialRep)})
                          </div>
                        </div>
                      )}
                      {!potentialRep && (
                        <div style={{
                          padding: "10px 12px", background: "rgba(245,158,11,0.06)",
                          borderRadius: 8, marginBottom: 12, fontSize: 12,
                          color: "var(--warning)",
                          display: "flex", alignItems: "center", gap: 8
                        }}>
                          <AlertTriangle size={14} />
                          <span>No suitable replacement available</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <button
                  className="btn"
                  style={{
                    width: "100%", background: "var(--danger)", color: "#fff",
                    border: "none", padding: "10px 0", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: 8
                  }}
                  onClick={() => handleMarkAbsent(
                    selectedStaff.staff, selectedStaff.dateStr, selectedStaff.shift
                  )}
                >
                  <UserX size={15} /> Mark as Absent
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Staff Activity Log ── */}
      <div className="card no-print" style={{ marginTop: 18 }}>
        <div
          onClick={() => setActivityOpen(!activityOpen)}
          style={{
            padding: "14px 18px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: activityOpen ? "1px solid var(--border)" : "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} style={{ color: "var(--primary)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
              Staff Activity Log
            </span>
            {activityLog.length > 0 && (
              <span style={{
                fontSize: 10, background: "var(--primary)",
                color: "#fff", borderRadius: 10, padding: "1px 7px",
                fontWeight: 600
              }}>
                {activityLog.length}
              </span>
            )}
          </div>
          {activityOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {activityOpen && (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {activityLog.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "30px 20px",
                color: "var(--text-muted)", fontSize: 13
              }}>
                No activity records found
              </div>
            ) : (
              <table style={{
                width: "100%", borderCollapse: "collapse", fontSize: 12
              }}>
                <thead>
                  <tr style={{ background: "var(--surface)" }}>
                    {["Staff", "Role", "Action", "Time", "Date"].map(h => (
                      <th key={h} style={{
                        padding: "8px 14px", textAlign: "left",
                        fontWeight: 600, fontSize: 11, color: "var(--text-muted)",
                        borderBottom: "1px solid var(--border)",
                        textTransform: "uppercase", letterSpacing: "0.5px"
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activityLog.slice(0, 20).map((act, i) => (
                    <tr key={act.id || i} style={{
                      borderBottom: "1px solid var(--border)"
                    }}>
                      <td style={{ padding: "8px 14px", fontWeight: 600, color: "var(--text)" }}>
                        {act.name}
                      </td>
                      <td style={{ padding: "8px 14px", color: "var(--text-muted)" }}>
                        {act.role || "—"}
                      </td>
                      <td style={{ padding: "8px 14px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 10,
                          fontWeight: 700,
                          background: act.action === "Login"
                            ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: act.action === "Login"
                            ? "var(--success)" : "var(--danger)"
                        }}>
                          {act.action === "Login" ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <Clock size={10} /> Login
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <Clock size={10} /> Logout
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{
                        padding: "8px 14px", fontFamily: "monospace",
                        fontSize: 11, color: "var(--text)"
                      }}>
                        {act.time}
                      </td>
                      <td style={{
                        padding: "8px 14px", fontSize: 11, color: "var(--text-muted)"
                      }}>
                        {act.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Print styles now handled by global index.css @media print rules */}
    </div>
  );
}

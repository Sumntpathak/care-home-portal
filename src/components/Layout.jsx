import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AIGuide from "./AIGuide";
import Breadcrumbs from "./Breadcrumbs";
import OfflineIndicator from "./OfflineIndicator";
import LanguageSwitcher from "./LanguageSwitcher";
import GoogleTranslate from "./GoogleTranslate";
import { useAuth } from "../context/AuthContext";
import { getConflictCount, onSyncChange } from '../lib/syncManager';
import {
  LayoutDashboard, Users, UserCircle, CalendarDays,
  ClipboardList, Pill, IndianRupee, Clock, LogOut,
  Stethoscope, BedDouble, AlertTriangle, Building,
  UserCheck, ArrowRightLeft, Heart, UtensilsCrossed,
  BarChart3, FileText, HeartPulse, Search, Bell, Sun, Moon,
  Menu, X, Shield, Activity, Siren, ChevronRight, FolderOpen,
  ChevronDown, Settings, HelpCircle, PanelLeftClose, PanelLeft,
  Sparkles, CircleDot, Baby, RefreshCw, FlaskConical, Image
} from "lucide-react";

const I = 18;

// Nav labels use i18n keys — resolved at render time via t()
const NAV_SECTIONS = {
  Admin: [
    { section: "nav.overview", id: "overview", items: [
      { to: "/", icon: <LayoutDashboard size={I}/>, labelKey: "nav.dashboard" },
      { to: "/reports", icon: <BarChart3 size={I}/>, labelKey: "nav.reports" },
      { to: "/clinical-audit", icon: <Shield size={I}/>, labelKey: "nav.clinicalAudit" },
      { to: "/sync-status", icon: <RefreshCw size={I}/>, labelKey: "nav.syncStatus" },
    ]},
    { section: "nav.patientCare", id: "care", items: [
      { to: "/patients", icon: <UserCircle size={I}/>, labelKey: "nav.patients" },
      { to: "/home-care", icon: <BedDouble size={I}/>, labelKey: "nav.homeCare" },
      { to: "/care-plans", icon: <ClipboardList size={I}/>, labelKey: "nav.carePlans" },
      { to: "/med-schedule", icon: <Pill size={I}/>, labelKey: "nav.medSchedule" },
      { to: "/dietary", icon: <UtensilsCrossed size={I}/>, labelKey: "nav.dietary" },
      { to: "/medical-file", icon: <FolderOpen size={I}/>, labelKey: "nav.medicalFile" },
      { to: "/maternity", icon: <Baby size={I}/>, labelKey: "nav.maternity" },
    ]},
    { section: "nav.operations", id: "ops", items: [
      { to: "/beds", icon: <Building size={I}/>, labelKey: "nav.beds" },
      { to: "/incidents", icon: <AlertTriangle size={I}/>, labelKey: "nav.incidents" },
      { to: "/visitors", icon: <UserCheck size={I}/>, labelKey: "nav.visitors" },
      { to: "/shift-handover", icon: <ArrowRightLeft size={I}/>, labelKey: "nav.shiftHandover" },
      { to: "/family-updates", icon: <Heart size={I}/>, labelKey: "nav.familyUpdates" },
      { to: "/lab", icon: <FlaskConical size={I}/>, labelKey: "nav.lab" },
      { to: "/radiology", icon: <Image size={I}/>, labelKey: "nav.radiology" },
    ]},
    { section: "nav.opd", id: "opd", items: [
      { to: "/appointments", icon: <CalendarDays size={I}/>, labelKey: "nav.appointments" },
      { to: "/prescriptions", icon: <FileText size={I}/>, labelKey: "nav.prescriptions" },
      { to: "/dispensary", icon: <Pill size={I}/>, labelKey: "nav.dispensary" },
      { to: "/medicines", icon: <Pill size={I}/>, labelKey: "nav.medicines" },
    ]},
    { section: "nav.admin", id: "admin", items: [
      { to: "/users", icon: <Users size={I}/>, labelKey: "nav.users" },
      { to: "/billing", icon: <IndianRupee size={I}/>, labelKey: "nav.billing" },
      { to: "/duty-roster", icon: <Clock size={I}/>, labelKey: "nav.dutyRoster" },
    ]},
  ],
  Doctor: [
    { section: "nav.clinical", id: "clinical", items: [
      { to: "/", icon: <LayoutDashboard size={I}/>, labelKey: "nav.dashboard" },
      { to: "/doctor-appointments", icon: <Stethoscope size={I}/>, labelKey: "nav.doctorQueue" },
      { to: "/prescriptions", icon: <ClipboardList size={I}/>, labelKey: "nav.prescriptions" },
      { to: "/patients", icon: <UserCircle size={I}/>, labelKey: "nav.patients" },
      { to: "/medical-file", icon: <FolderOpen size={I}/>, labelKey: "nav.medicalFile" },
      { to: "/clinical-audit", icon: <Shield size={I}/>, labelKey: "nav.clinicalAudit" },
    ]},
    { section: "nav.patientCare", id: "care", items: [
      { to: "/care-plans", icon: <FileText size={I}/>, labelKey: "nav.carePlans" },
      { to: "/med-schedule", icon: <Pill size={I}/>, labelKey: "nav.medSchedule" },
      { to: "/incidents", icon: <AlertTriangle size={I}/>, labelKey: "nav.incidents" },
    ]},
  ],
  "Staff:Appointment Desk": [
    { section: "nav.opd", id: "fd", items: [
      { to: "/", icon: <LayoutDashboard size={I}/>, labelKey: "nav.dashboard" },
      { to: "/appointments", icon: <CalendarDays size={I}/>, labelKey: "nav.appointments" },
      { to: "/patients", icon: <UserCircle size={I}/>, labelKey: "nav.patients" },
      { to: "/billing", icon: <IndianRupee size={I}/>, labelKey: "nav.billing" },
      { to: "/visitors", icon: <UserCheck size={I}/>, labelKey: "nav.visitors" },
      { to: "/medical-file", icon: <FolderOpen size={I}/>, labelKey: "nav.medicalFile" },
    ]},
  ],
  "Staff:Receptionist": [
    { section: "nav.opd", id: "rec", items: [
      { to: "/", icon: <LayoutDashboard size={I}/>, labelKey: "nav.dashboard" },
      { to: "/appointments", icon: <CalendarDays size={I}/>, labelKey: "nav.appointments" },
      { to: "/patients", icon: <UserCircle size={I}/>, labelKey: "nav.patients" },
      { to: "/billing", icon: <IndianRupee size={I}/>, labelKey: "nav.billing" },
      { to: "/visitors", icon: <UserCheck size={I}/>, labelKey: "nav.visitors" },
    ]},
  ],
  "Staff:Dispensary": [
    { section: "nav.dispensary", id: "pharm", items: [
      { to: "/", icon: <LayoutDashboard size={I}/>, labelKey: "nav.dashboard" },
      { to: "/dispensary", icon: <Pill size={I}/>, labelKey: "nav.dispensary" },
      { to: "/medicines", icon: <Pill size={I}/>, labelKey: "nav.medicines" },
      { to: "/med-schedule", icon: <Clock size={I}/>, labelKey: "nav.medSchedule" },
    ]},
  ],
  "Staff:Home Care": [
    { section: "nav.patientCare", id: "nursing", items: [
      { to: "/", icon: <LayoutDashboard size={I}/>, labelKey: "nav.dashboard" },
      { to: "/home-care", icon: <BedDouble size={I}/>, labelKey: "nav.homeCare" },
      { to: "/med-schedule", icon: <Pill size={I}/>, labelKey: "nav.medSchedule" },
      { to: "/care-plans", icon: <ClipboardList size={I}/>, labelKey: "nav.carePlans" },
      { to: "/dietary", icon: <UtensilsCrossed size={I}/>, labelKey: "nav.dietary" },
      { to: "/patients", icon: <UserCircle size={I}/>, labelKey: "nav.patients" },
    ]},
    { section: "nav.operations", id: "ops", items: [
      { to: "/shift-handover", icon: <ArrowRightLeft size={I}/>, labelKey: "nav.shiftHandover" },
      { to: "/incidents", icon: <AlertTriangle size={I}/>, labelKey: "nav.incidents" },
      { to: "/family-updates", icon: <Heart size={I}/>, labelKey: "nav.familyUpdates" },
    ]},
  ],
  "Staff:Lab": [
    { section: "nav.clinical", id: "lab", items: [
      { to: "/", icon: <LayoutDashboard size={I}/>, labelKey: "nav.dashboard" },
      { to: "/patients", icon: <UserCircle size={I}/>, labelKey: "nav.patients" },
    ]},
  ],
  "Staff:default": [
    { section: "nav.overview", id: "gen", items: [
      { to: "/", icon: <LayoutDashboard size={I}/>, labelKey: "nav.dashboard" },
      { to: "/patients", icon: <UserCircle size={I}/>, labelKey: "nav.patients" },
      { to: "/duty-roster", icon: <Clock size={I}/>, labelKey: "nav.dutyRoster" },
      { to: "/visitors", icon: <UserCheck size={I}/>, labelKey: "nav.visitors" },
    ]},
  ],
};

const ROLE_COLOR = { Admin: "var(--primary)", Doctor: "var(--accent2)", Staff: "var(--purple)" };
const ROLE_BG = {
  Admin: "linear-gradient(135deg, #4f8cdb, #3a6fb5)",
  Doctor: "linear-gradient(135deg, #7c8cc4, #6770a8)",
  Staff: "linear-gradient(135deg, #9b7ec8, #7a62b0)",
};

function getSections(role, position) {
  if (role === "Admin" || role === "Doctor") return NAV_SECTIONS[role];
  return NAV_SECTIONS[`Staff:${position}`] || NAV_SECTIONS["Staff:default"];
}

const SAMPLE_NOTIFICATIONS = [
  { id: 1, type: "incident", title: "Fall Incident Reported", desc: "Room 105 — Kamla Devi", time: "5 min ago", unread: true, color: "var(--danger)" },
  { id: 2, type: "med", title: "Med Round Due", desc: "Evening medications — 6 patients pending", time: "15 min ago", unread: true, color: "var(--warning)" },
  { id: 3, type: "visitor", title: "Visitor Checked In", desc: "Ramesh Kumar for Shanti Devi", time: "30 min ago", unread: false, color: "var(--info)" },
  { id: 4, type: "handover", title: "Shift Handover Pending", desc: "Morning → Afternoon handover", time: "1 hour ago", unread: false, color: "var(--accent2)" },
  { id: 5, type: "stock", title: "Low Stock Alert", desc: "Metformin 500mg — 15 units remaining", time: "2 hours ago", unread: false, color: "var(--accent3)" },
];

export default function Layout() {
  const { user, logout, isStaff, isAdmin, sessionWarning } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem("ch_theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("ch_sidebar_collapsed") === "true");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const notifRef = useRef(null);

  const role = user?.role || "Staff";
  const position = user?.position || "";
  const sections = useMemo(() => getSections(role, position), [role, position]);
  const roleLabel = isStaff ? (position || "Staff") : (role || "Staff");
  const roleBg = ROLE_BG[role] || ROLE_BG.Staff;
  const userInitial = (user?.name || "U")[0].toUpperCase();
  const unreadCount = useMemo(() => SAMPLE_NOTIFICATIONS.filter(n => n.unread).length, []);

  const [conflictCount, setConflictCount] = useState(0);
  useEffect(() => {
    getConflictCount().then(setConflictCount).catch(() => {});
    const unsub = onSyncChange(() => {
      getConflictCount().then(setConflictCount).catch(() => {});
    });
    return unsub;
  }, []);

  // Initialize all sections as expanded
  useEffect(() => {
    const initial = {};
    sections.forEach(s => { initial[s.id] = true; });
    setExpandedSections(initial);
  }, [role, position]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ch_theme", theme);
  }, [theme]);

  // React 18 batches these automatically, but be explicit
  useEffect(() => {
    setSidebarOpen(false);
    setShowNotifications(false);
    setHoveredItem(null);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleSection = useCallback((id) => {
    if (collapsed && !sidebarOpen) return;
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  }, [collapsed, sidebarOpen]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("ch_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  // Check if a section contains the active route
  const activeSection = useMemo(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.to === "/" && (location.pathname === "/" || location.pathname === "")) return section.id;
        if (item.to !== "/" && location.pathname.startsWith(item.to)) return section.id;
      }
    }
    return null;
  }, [location.pathname, sections]);

  const sectionHasActive = useCallback((section) => section.id === activeSection, [activeSection]);

  return (
    <div className="app">
      {/* SIDEBAR OVERLAY (mobile) */}
      {sidebarOpen && <div className="sb-overlay no-print" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`sb no-print${sidebarOpen ? " sb-open sb-mobile-full" : ""}${collapsed && !sidebarOpen ? " sb-collapsed" : ""}`}>

        {/* Brand Header */}
        <div className="sb-header">
          <div className="sb-logo-wrap" onClick={() => navigate("/")}>
            <div className="sb-logo">
              <HeartPulse size={(collapsed && !sidebarOpen) ? 20 : 22} color="#fff" strokeWidth={2.5} />
              <div className="sb-logo-pulse" />
            </div>
            {(!collapsed || sidebarOpen) && (
              <div className="sb-brand">
                <div className="sb-brand-name">shanti<span>care</span></div>
                <div className="sb-brand-tag">Nursing Home</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button className="sb-close-mobile" onClick={() => setSidebarOpen(false)} style={{
              background: "none", border: "1px solid var(--border)", borderRadius: 8,
              padding: 6, cursor: "pointer", color: "var(--text-muted)", display: "none",
            }}>
              <X size={18} />
            </button>
          )}
          {(!collapsed || sidebarOpen) && (
            <button className="sb-collapse-btn" onClick={toggleCollapse} title="Collapse sidebar">
              <PanelLeftClose size={16} />
            </button>
          )}
          {(collapsed && !sidebarOpen) && (
            <button className="sb-collapse-btn" onClick={toggleCollapse} title="Expand sidebar" style={{ margin: "4px auto 0" }}>
              <PanelLeft size={16} />
            </button>
          )}
        </div>

        {/* Quick Stats Banner */}
        {(!collapsed || sidebarOpen) && (
          <div className="sb-status-bar">
            <div className="sb-status-item">
              <CircleDot size={8} className="sb-status-dot" />
              <span>Online</span>
            </div>
            <div className="sb-status-time">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sb-nav">
          {sections.map((section) => {
            const isExpanded = expandedSections[section.id] !== false;
            const hasActive = sectionHasActive(section);

            return (
              <div key={section.id} className={`sb-section${hasActive ? " sb-section-active" : ""}`}>
                {/* Section Header (collapsible) */}
                <button
                  className={`sb-section-header${isExpanded ? " expanded" : ""}`}
                  onClick={() => toggleSection(section.id)}
                  title={(collapsed && !sidebarOpen) ? t(section.section) : undefined}
                >
                  {(collapsed && !sidebarOpen) ? (
                    <div className="sb-section-dot" style={{ background: hasActive ? "var(--primary)" : "var(--border)" }} />
                  ) : (
                    <>
                      <span className="sb-section-label">{t(section.section)}</span>
                      <ChevronDown
                        size={12}
                        className={`sb-section-chevron${isExpanded ? " rotated" : ""}`}
                      />
                    </>
                  )}
                </button>

                {/* Section Items */}
                <div className={`sb-section-items${isExpanded || collapsed || sidebarOpen ? " expanded" : ""}`}>
                  {section.items.map(({ to, icon, labelKey, badge }) => {
                    const label = t(labelKey || 'nav.dashboard');
                    return (
                    <NavLink
                      key={to} to={to} end={to === "/"}
                      className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}
                      title={(collapsed && !sidebarOpen) ? label : undefined}
                      onClick={() => setSidebarOpen(false)}
                      onMouseEnter={() => (collapsed && !sidebarOpen) && setHoveredItem(to)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span className="sb-link-indicator" />
                      <span className="sb-link-icon">{icon}</span>
                      {(!collapsed || sidebarOpen) && <span className="sb-link-label">{label}</span>}
                      {(!collapsed || sidebarOpen) && badge && <span className="sb-link-badge">{badge}</span>}
                      {to === '/sync-status' && conflictCount > 0 && (
                        <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', borderRadius: '10px', padding: '0 6px', fontSize: '10px', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>{conflictCount}</span>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {(collapsed && !sidebarOpen) && hoveredItem === to && (
                        <div className="sb-tooltip">{label}</div>
                      )}
                    </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sb-footer">
          {(!collapsed || sidebarOpen) && (
            <button className="sb-footer-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          )}

          <div className="sb-user" onClick={() => (collapsed && !sidebarOpen) && toggleCollapse()}>
            <div className="sb-user-avatar" style={{ background: roleBg }}>
              {userInitial}
              <span className="sb-user-status" />
            </div>
            {(!collapsed || sidebarOpen) && (
              <div className="sb-user-info">
                <div className="sb-user-name">{user?.name}</div>
                <div className="sb-user-role">{roleLabel}</div>
              </div>
            )}
            {(!collapsed || sidebarOpen) && (
              <button className="sb-logout-btn" onClick={(e) => { e.stopPropagation(); logout(); navigate("/login"); }} title="Sign out">
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── APP BODY ── */}
      <div className={`app-body${(collapsed && !sidebarOpen) ? " app-body-collapsed" : ""}`}>
        {/* TOPBAR */}
        <div className="topbar no-print">
          <div className="topbar-left">
            <button className="topbar-menu-btn" onClick={() => setSidebarOpen(s => !s)}>
              <Menu size={18} />
            </button>
            <div className="topbar-logo" onClick={() => navigate("/")}>
              <div className="logo-icon"><HeartPulse size={17} color="#fff" /></div>
              <div className="brand-text"><div className="brand-name">shanti<span>care</span></div></div>
            </div>
            <div className="topbar-search">
              <Search size={15} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search patients, rooms, records..." />
            </div>
          </div>
          <div className="topbar-right">
            <OfflineIndicator />
            <GoogleTranslate />
            {isAdmin && (
              <button className="sos-btn" onClick={() => navigate("/incidents")} title="Emergency">
                <Siren size={14} /> SOS
              </button>
            )}
            <button className="topbar-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div ref={notifRef} style={{ position: "relative" }}>
              <button className="topbar-btn" onClick={() => setShowNotifications(s => !s)} title="Notifications">
                <Bell size={16} />
                {unreadCount > 0 && <span className="notif-dot" />}
              </button>
              {showNotifications && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    <h4>Notifications</h4>
                    <span style={{ fontSize: "12px", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}>Mark all read</span>
                  </div>
                  <div className="notif-list">
                    {SAMPLE_NOTIFICATIONS.map(n => (
                      <div key={n.id} className={`notif-item${n.unread ? " unread" : ""}`}>
                        <div className="notif-icon" style={{ background: `color-mix(in srgb, ${n.color} 12%, transparent)` }}>
                          {n.type === "incident" && <AlertTriangle size={16} color={n.color} />}
                          {n.type === "med" && <Pill size={16} color={n.color} />}
                          {n.type === "visitor" && <UserCheck size={16} color={n.color} />}
                          {n.type === "handover" && <ArrowRightLeft size={16} color={n.color} />}
                          {n.type === "stock" && <AlertTriangle size={16} color={n.color} />}
                        </div>
                        <div className="notif-content">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-desc">{n.desc}</div>
                          <div className="notif-time">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="topbar-divider" />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="user-avatar" style={{ background: roleBg }}>{userInitial}</div>
              <span className="user-name">{user?.name}</span>
            </div>
          </div>
        </div>

        {sessionWarning > 0 && sessionWarning <= 300 && (
          <div style={{
            background: "#fef2f2", borderBottom: "1px solid #fecaca",
            padding: "8px 16px", fontSize: 12, color: "#dc2626", fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            Session expires in {Math.floor(sessionWarning / 60)}:{String(sessionWarning % 60).padStart(2, "0")} — move your mouse to stay logged in
          </div>
        )}
        <div className="main">
          <Breadcrumbs />
          <Outlet />
        </div>
      </div>
      <AIGuide />
    </div>
  );
}

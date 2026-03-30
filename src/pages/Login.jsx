import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, patientLogin } from "../api/sheets";
import { checkRateLimit, recordAttempt, resetRateLimit } from "../utils/security";
import {
  HeartPulse, Shield, Stethoscope, UserCheck, BedDouble, Pill,
  Eye, EyeOff, Users, ClipboardList,
  ArrowRight, Activity, FolderOpen, Heart,
  CalendarDays, AlertTriangle, BarChart3,
  Mail, Lock, FileText, Sparkles, LogIn,
  CheckCircle, Star, Clock, Clipboard,
  TrendingUp, Zap, ListChecks, Layers
} from "lucide-react";

const DEMOS = [
  { label: "Admin", user: "pathaksumnt4u@gmail.com", pass: "admin123", icon: Shield, gradient: "linear-gradient(135deg,#4f8cdb,#3a6fb5)" },
  { label: "Doctor", user: "dr.meena", pass: "doc123", icon: Stethoscope, gradient: "linear-gradient(135deg,#7c8cc4,#6770a8)" },
  { label: "Nurse", user: "sunita", pass: "staff123", icon: BedDouble, gradient: "linear-gradient(135deg,#9b7ec8,#7a62b0)" },
  { label: "Reception", user: "neeta", pass: "staff123", icon: UserCheck, gradient: "linear-gradient(135deg,#d4956a,#b87d52)" },
  { label: "Pharmacy", user: "amit", pass: "staff123", icon: Pill, gradient: "linear-gradient(135deg,#d4685a,#b85448)" },
];

const DOCTOR_FEATURES = [
  {
    icon: ListChecks,
    title: "Smart Patient Queue",
    desc: "Real-time patient queue with status tracking. See who's waiting, who's being attended, and manage flow effortlessly.",
    color: "#4f8cdb",
    bg: "#e8f1fb",
  },
  {
    icon: Clipboard,
    title: "Digital Prescriptions",
    desc: "Write, edit, and manage prescriptions digitally. Auto-suggestions for medicines with dosage & duration templates.",
    color: "#5ba08c",
    bg: "#e6f5f0",
  },
  {
    icon: FolderOpen,
    title: "Complete Medical Files",
    desc: "Access patient history, past prescriptions, lab reports, and vitals — all in one unified medical record.",
    color: "#7c8cc4",
    bg: "#eef0f8",
  },
  {
    icon: CalendarDays,
    title: "Appointment Management",
    desc: "View your daily schedule, upcoming appointments, follow-ups, and walk-in patients at a glance.",
    color: "#d4956a",
    bg: "#fdf0e6",
  },
  {
    icon: TrendingUp,
    title: "Clinical Insights",
    desc: "Track patient outcomes, view treatment trends, and get analytics on your practice performance.",
    color: "#9b7ec8",
    bg: "#f3eef9",
  },
  {
    icon: Heart,
    title: "Care Plan Builder",
    desc: "Create and manage comprehensive care plans for long-term residents with medication schedules and milestones.",
    color: "#d4685a",
    bg: "#fce8e5",
  },
];

const PLATFORM_FEATURES = [
  { icon: Users, label: "Resident Mgmt" },
  { icon: Pill, label: "Med Rounds" },
  { icon: ClipboardList, label: "Care Plans" },
  { icon: BedDouble, label: "Bed Tracking" },
  { icon: AlertTriangle, label: "Incidents" },
  { icon: BarChart3, label: "Reports" },
  { icon: Activity, label: "OPD Clinic" },
  { icon: Layers, label: "Dispensary" },
];

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("staff");
  const [form, setForm] = useState({ username: "", password: "", receipt: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto-rotate featured cards
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature(p => (p + 1) % DOCTOR_FEATURES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleStaff = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setErr("Please fill in all fields."); return; }
    // Rate limiting — 5 attempts per 15 minutes
    const limit = checkRateLimit("login:" + form.username, 5, 15 * 60 * 1000);
    if (!limit.allowed) { setErr(limit.message); return; }
    setLoading(true); setErr("");
    try {
      const res = await login(form.username, form.password);
      if (res.success) { resetRateLimit("login:" + form.username); loginUser(res.user); navigate("/"); }
      else { recordAttempt("login:" + form.username); setErr(res.message || "Invalid credentials."); }
    } catch { setErr("Connection error."); }
    finally { setLoading(false); }
  };

  const handlePatient = async (e) => {
    e.preventDefault();
    if (!form.receipt) { setErr("Enter receipt number."); return; }
    const limit = checkRateLimit("patient-login", 5, 15 * 60 * 1000);
    if (!limit.allowed) { setErr(limit.message); return; }
    setLoading(true); setErr("");
    try {
      const res = await patientLogin(form.receipt.trim());
      if (res.success) {
        loginUser({ ...res.patient, role: "Patient", _data: { appointments: res.appointments, records: res.records } });
        navigate("/");
      } else setErr(res.message || "Receipt not found.");
    } catch { setErr("Connection error."); }
    finally { setLoading(false); }
  };

  const quickLogin = async (d) => {
    setLoading(true); setErr("");
    try {
      const res = await login(d.user, d.pass);
      if (res.success) { loginUser(res.user); navigate("/"); }
    } catch { setErr("Connection error."); }
    finally { setLoading(false); }
  };

  const feat = DOCTOR_FEATURES[activeFeature];
  const FeatIcon = feat.icon;

  return (
    <div className="lp">
      {/* ═══ LEFT — Feature Showcase ═══ */}
      <div className="lp-left">
        <div className="lp-left-inner">
          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-logo"><HeartPulse size={20} color="#fff" strokeWidth={2.5} /></div>
            <div>
              <div className="lp-brand-name">shanti<span>care</span></div>
              <div className="lp-brand-tag">Nursing Home Management</div>
            </div>
          </div>

          {/* Hero */}
          <div className="lp-hero">
            <h1>Built for <span>modern doctors</span><br />& care teams</h1>
            <p>A powerful, intuitive platform that simplifies patient management, prescriptions, and clinical workflows.</p>
          </div>

          {/* Doctor Feature Spotlight — Large card */}
          <div className="lp-spotlight">
            <div className="lp-spotlight-label">
              <Stethoscope size={12} />
              <span>Doctor Features</span>
            </div>
            <div className="lp-spotlight-card" key={activeFeature}>
              <div className="lp-spotlight-icon" style={{ background: feat.bg }}>
                <FeatIcon size={22} color={feat.color} strokeWidth={2} />
              </div>
              <div className="lp-spotlight-body">
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            </div>
            {/* Progress dots */}
            <div className="lp-spotlight-dots">
              {DOCTOR_FEATURES.map((_, i) => (
                <button
                  key={i}
                  className={`lp-dot${i === activeFeature ? " active" : ""}`}
                  onClick={() => setActiveFeature(i)}
                />
              ))}
            </div>
          </div>

          {/* Feature grid — smaller cards */}
          <div className="lp-feat-grid">
            {DOCTOR_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <button
                  key={i}
                  className={`lp-feat-card${i === activeFeature ? " active" : ""}`}
                  onClick={() => setActiveFeature(i)}
                >
                  <div className="lp-feat-card-icon" style={{ background: i === activeFeature ? f.color : f.bg }}>
                    <Icon size={14} color={i === activeFeature ? "#fff" : f.color} strokeWidth={2} />
                  </div>
                  <span>{f.title}</span>
                </button>
              );
            })}
          </div>

          {/* Platform features */}
          <div className="lp-bottom">
            <div className="lp-platform-label">
              <Zap size={10} />
              <span>Complete Platform</span>
            </div>
            <div className="lp-features-row">
              {PLATFORM_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="lp-feat"><Icon size={11} /><span>{f.label}</span></div>
                );
              })}
            </div>
            <div className="lp-trust-bar">
              <div className="lp-trust-stars">{[...Array(5)].map((_, i) => <Star key={i} size={10} fill="rgba(255,255,255,.6)" color="rgba(255,255,255,.6)" />)}</div>
              <span>Trusted by <strong>50+ care homes</strong> across India</span>
            </div>
          </div>
        </div>
        <div className="lp-left-pattern" />
      </div>

      {/* ═══ RIGHT — Login Form ═══ */}
      <div className="lp-right">
        <div className="lp-right-inner">
          <div className="lp-mobile-brand">
            <div className="lp-logo"><HeartPulse size={20} color="#fff" strokeWidth={2.5} /></div>
            <div className="lp-brand-name" style={{ color: "var(--text)", fontSize: "20px" }}>shanti<span>care</span></div>
          </div>

          <div className="lp-welcome">
            <div className="lp-welcome-badge"><Sparkles size={11} /><span>Secure Portal</span></div>
            <h2>Welcome back</h2>
            <p>Sign in to manage care operations</p>
          </div>

          <div className="lp-tabs">
            <button className={`lp-tab${tab === "staff" ? " active" : ""}`} onClick={() => { setTab("staff"); setErr(""); }}>
              <div className="lp-tab-icon"><Shield size={15} /></div>
              <div className="lp-tab-text"><span className="lp-tab-label">Staff / Doctor</span></div>
            </button>
            <button className={`lp-tab${tab === "patient" ? " active" : ""}`} onClick={() => { setTab("patient"); setErr(""); }}>
              <div className="lp-tab-icon"><UserCheck size={15} /></div>
              <div className="lp-tab-text"><span className="lp-tab-label">Patient Portal</span></div>
            </button>
          </div>

          {err && <div className="lp-error"><AlertTriangle size={14} /><span>{err}</span></div>}

          {tab === "staff" ? (
            <>
              <form onSubmit={handleStaff} className="lp-form">
                <div className={`lp-input-group${focusedField === "username" ? " focused" : ""}${form.username ? " filled" : ""}`}>
                  <div className="lp-input-icon"><Mail size={16} /></div>
                  <div className="lp-input-body">
                    <label className="lp-input-label">Username or Email</label>
                    <input value={form.username} onChange={e => set("username", e.target.value)} onFocus={() => setFocusedField("username")} onBlur={() => setFocusedField(null)} placeholder="Enter your username" autoComplete="username" />
                  </div>
                </div>
                <div className={`lp-input-group${focusedField === "password" ? " focused" : ""}${form.password ? " filled" : ""}`}>
                  <div className="lp-input-icon"><Lock size={16} /></div>
                  <div className="lp-input-body">
                    <label className="lp-input-label">Password</label>
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} placeholder="Enter your password" autoComplete="current-password" />
                  </div>
                  <button type="button" className="lp-input-action" onClick={() => setShowPass(p => !p)}>{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                <div className="lp-form-options">
                  <label className="lp-checkbox"><input type="checkbox" defaultChecked /><span className="lp-checkmark" /><span>Remember me</span></label>
                  <a className="lp-forgot" href="#" onClick={e => e.preventDefault()}>Forgot password?</a>
                </div>
                <button className="lp-submit" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 16, height: 16, borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> : <><LogIn size={16} /> Sign In <ArrowRight size={14} className="lp-submit-arrow" /></>}
                </button>
              </form>
              <div className="lp-divider"><span>Quick demo</span></div>
              <div className="lp-demo-row">
                {DEMOS.map(d => {
                  const Icon = d.icon;
                  return (
                    <button key={d.label} className="lp-demo-chip" onClick={() => quickLogin(d)} disabled={loading} title={d.label}>
                      <div className="lp-demo-chip-icon" style={{ background: d.gradient }}><Icon size={13} color="#fff" /></div>
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <form onSubmit={handlePatient} className="lp-form">
              <div className="lp-patient-info"><Activity size={16} /><span>Enter your OPD receipt to view prescriptions & records</span></div>
              <div className={`lp-input-group${focusedField === "receipt" ? " focused" : ""}${form.receipt ? " filled" : ""}`}>
                <div className="lp-input-icon"><FileText size={16} /></div>
                <div className="lp-input-body">
                  <label className="lp-input-label">OPD Receipt Number</label>
                  <input value={form.receipt} onChange={e => set("receipt", e.target.value)} onFocus={() => setFocusedField("receipt")} onBlur={() => setFocusedField(null)} placeholder="e.g. REC-1005-0005" />
                </div>
              </div>
              <button className="lp-submit" type="submit" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 16, height: 16, borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> : <><FolderOpen size={16} /> View My Records <ArrowRight size={14} className="lp-submit-arrow" /></>}
              </button>
              <div className="lp-hint">Demo: <strong>REC-1005-0005</strong></div>
            </form>
          )}
          <div className="lp-footer"><p>Shanti Care Home &copy; 2026</p></div>
        </div>
      </div>
    </div>
  );
}

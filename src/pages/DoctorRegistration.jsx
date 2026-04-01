/**
 * Doctor Self-Registration
 * Doctors register to test the clinical engines with sample patients.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerDoctor } from "../api/sheets";
import { validateName, validateEmail, validatePhone, validatePassword } from "../utils/security";
import { HeartPulse, Stethoscope, ArrowRight, Check, Shield, UserPlus, Eye, EyeOff, Mail, Lock, Phone, FileText, Award } from "lucide-react";

const SPECIALIZATIONS = [
  "General Physician", "Internal Medicine", "Geriatric Medicine", "Cardiologist",
  "Pulmonologist", "Nephrologist", "Neurologist", "Endocrinologist",
  "Psychiatrist", "Orthopedics", "Gynecologist", "Pediatrician",
  "Dermatologist", "ENT Specialist", "Ophthalmologist", "Surgeon",
  "Oncologist", "Gastroenterologist", "Rheumatologist", "Other",
];

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", specialization: SPECIALIZATIONS[0], license: "", degree: "MBBS", password: "", confirmPassword: "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr("");

    if (!validateName(form.name)) return setErr("Full name is required (2-100 characters).");
    if (!validateEmail(form.email)) return setErr("Valid email address required.");
    if (form.phone && !validatePhone(form.phone)) return setErr("Phone must be 10-13 digits.");
    if (!validatePassword(form.password)) return setErr("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setErr("Passwords do not match.");
    if (!agreed) return setErr("Please agree to the testing terms.");

    setSaving(true);
    try {
      const res = await registerDoctor({
        name: form.name,
        email: form.email,
        phone: form.phone,
        specialization: form.specialization,
        license: form.license,
        degree: form.degree,
        password: form.password,
      });

      if (res.success) {
        loginUser(res.user);
        navigate("/doctor-onboarding");
      } else {
        setErr(res.message || "Registration failed.");
      }
    } catch {
      setErr("Connection error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc" }}>
      {/* Left panel — value prop */}
      <div style={{ flex: "0 0 45%", background: "linear-gradient(155deg, #1a3a5c, #1e4d6e, #1a5f5a, #1e3a4a)", padding: "60px 48px", display: isMobile ? "none" : "flex", flexDirection: "column", justifyContent: "center", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", right: "-5%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(109,213,180,.1), transparent)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartPulse size={24} color="#6dd5b4" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>shanti<span style={{ color: "#6dd5b4" }}>care</span></div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Clinical Intelligence Platform</div>
          </div>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.3, marginBottom: 16, letterSpacing: "-0.02em" }}>
          Help us validate<br />clinical safety engines.
        </h1>
        <p style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.7, marginBottom: 32, maxWidth: 400 }}>
          Register as a doctor to test our drug interaction checker, vitals analyzer, and clinical decision pipeline with real sample patients.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: <Stethoscope size={16} />, text: "5-pass drug interaction engine (CYP450, P-gp, QT)" },
            { icon: <Shield size={16} />, text: "Your feedback directly improves patient safety" },
            { icon: <FileText size={16} />, text: "All testing data exportable as clinical validation report" },
            { icon: <Award size={16} />, text: "Get credited as a clinical validator" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, opacity: 0.8 }}>
              <div style={{ color: "#6dd5b4" }}>{item.icon}</div>
              {item.text}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, padding: "14px 18px", background: "rgba(255,255,255,.08)", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
          <strong style={{ opacity: 1 }}>Audited by 3 AI systems:</strong> Gemini (9.5/10), Claude (9.5/10), GPT-4 (5/5). Full audit report available after registration.
        </div>
      </div>

      {/* Right panel — registration form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ marginBottom: 28 }}>
            {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1a3a5c, #1a5f5a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HeartPulse size={18} color="#6dd5b4" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>shanti<span style={{ color: "#3b82f6" }}>care</span></div>
            </div>
          )}
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 6 }}>Register as Doctor</h2>
            <p style={{ fontSize: 14, color: "#6b7280" }}>Create your testing profile to evaluate clinical engines</p>
          </div>

          {err && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#dc2626", marginBottom: 16, border: "1px solid #fecaca" }}>{err}</div>
          )}

          <form onSubmit={handleRegister}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Full Name <span style={{ color: "#dc2626" }}>*</span></label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "0 12px", color: "#9ca3af" }}><UserPlus size={16} /></div>
                  <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Dr. Full Name" style={{ flex: 1, padding: "11px 12px 11px 0", border: "none", outline: "none", fontSize: 14 }} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Email <span style={{ color: "#dc2626" }}>*</span></label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "0 12px", color: "#9ca3af" }}><Mail size={16} /></div>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="doctor@hospital.com" style={{ flex: 1, padding: "11px 12px 11px 0", border: "none", outline: "none", fontSize: 14 }} />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Phone (Optional)</label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "0 12px", color: "#9ca3af" }}><Phone size={16} /></div>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit mobile" style={{ flex: 1, padding: "11px 12px 11px 0", border: "none", outline: "none", fontSize: 14 }} />
                </div>
              </div>

              {/* Specialization + Degree */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Specialization</label>
                  <select value={form.specialization} onChange={e => set("specialization", e.target.value)} style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Degree</label>
                  <select value={form.degree} onChange={e => set("degree", e.target.value)} style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    {["MBBS", "MD", "MS", "DM", "MCh", "DNB", "BAMS", "BHMS", "BDS", "MDS", "Other"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* License */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Medical Registration No. (Optional)</label>
                <input value={form.license} onChange={e => set("license", e.target.value)} placeholder="e.g., MH-12345" style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
              </div>

              {/* Password */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Password <span style={{ color: "#dc2626" }}>*</span></label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ padding: "0 12px", color: "#9ca3af" }}><Lock size={16} /></div>
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 6 chars" style={{ flex: 1, padding: "11px 8px 11px 0", border: "none", outline: "none", fontSize: 14 }} />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ padding: "0 10px", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Confirm <span style={{ color: "#dc2626" }}>*</span></label>
                  <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Repeat password" style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>

              {/* Agreement */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#6b7280", cursor: "pointer" }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
                <span>I understand this is a testing environment with sample patient data. My feedback on clinical engine accuracy will be used to improve patient safety. No real patient data is involved.</span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={saving} style={{
                width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff",
                fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16, borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> : <><Stethoscope size={16} /> Create Testing Profile <ArrowRight size={14} /></>}
              </button>
            </div>
          </form>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6b7280" }}>
            Already registered? <a href="#/login" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>Sign In</a>
          </div>
        </div>
      </div>
    </div>
  );
}

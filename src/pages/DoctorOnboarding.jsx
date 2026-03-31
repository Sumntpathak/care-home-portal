/**
 * Doctor Onboarding — Guided testing walkthrough
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, Users, FileText, Shield, BarChart3, ArrowRight, Check, Play, Pill, Activity, ClipboardList } from "lucide-react";

const STEPS = [
  {
    icon: Users, title: "View Sample Patients", desc: "12 realistic patients with conditions like Diabetes, CKD, Heart Failure, Parkinson's, COPD. Full medical histories, allergies, and current medications.",
    path: "/patients", color: "#3b82f6", bg: "#eff6ff",
  },
  {
    icon: FileText, title: "Write a Prescription", desc: "Pick any patient, write a prescription. As you type drug names, the 5-pass interaction engine runs in real-time. Try: Warfarin + Aspirin.",
    path: "/doctor-appointments", color: "#8b5cf6", bg: "#f5f3ff",
  },
  {
    icon: Pill, title: "Test Drug Interactions", desc: "The engine checks CYP450 metabolism, P-glycoprotein transport, QT prolongation, opposing forces, and 40+ FDA rules — all in milliseconds.",
    path: "/doctor-appointments", color: "#dc2626", bg: "#fef2f2",
  },
  {
    icon: Shield, title: "Review Engine Accuracy", desc: "See what the engine flagged. Mark alerts as Valid, Override, or False Positive. Your feedback directly trains the next version.",
    path: "/clinical-audit", color: "#10b981", bg: "#ecfdf5",
  },
];

export default function DoctorOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);

  const startSession = () => {
    // Store session start time
    const session = {
      doctorName: user?.name,
      email: user?.email,
      specialization: user?.specialization || user?.position,
      startTime: new Date().toISOString(),
    };
    try { localStorage.setItem("doctor_testing_session", JSON.stringify(session)); } catch {}
    setStarted(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Welcome */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#fff" }}>
            <Stethoscope size={28} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", marginBottom: 8 }}>
            Welcome, {user?.name || "Doctor"}
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280" }}>
            {user?.specialization || user?.position || "Specialist"} — Testing Profile
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 600, marginTop: 12 }}>
            <Activity size={12} /> Clinical Engine Testing Mode
          </div>
        </div>

        {/* Testing Guide */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,.06)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 6 }}>How Testing Works</h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.7 }}>
            Follow these 4 steps. Every action you take is logged by the clinical audit system. After testing, your feedback becomes part of our clinical validation evidence.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: 16, borderRadius: 12, border: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={22} color={step.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: step.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{step.title}</h3>
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 8 }}>{step.desc}</p>
                    <button onClick={() => navigate(step.path)} style={{ fontSize: 12, fontWeight: 600, color: step.color, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                      Go to {step.title} <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Session */}
        {!started ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,.06)", textAlign: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 8 }}>Ready to begin?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Start a testing session. A timer will track your activity and the audit system will log every engine call.</p>
            <button onClick={startSession} style={{
              padding: "12px 32px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
              fontSize: 15, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <Play size={16} /> Start Testing Session
            </button>
          </div>
        ) : (
          <div style={{ background: "#ecfdf5", borderRadius: 16, padding: 28, border: "1px solid #bbf7d0", textAlign: "center" }}>
            <Check size={24} style={{ color: "#10b981", marginBottom: 8 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#15803d", marginBottom: 8 }}>Session Started</h3>
            <p style={{ fontSize: 13, color: "#047857", marginBottom: 16 }}>Your testing session is active. All engine calls and feedback are being recorded.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/patients")} style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                View Patients
              </button>
              <button onClick={() => navigate("/doctor-testing")} style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "#111", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                <BarChart3 size={13} style={{ marginRight: 4, verticalAlign: "middle" }} /> Testing Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/")} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            Skip to Dashboard
          </button>
          <button onClick={() => navigate("/clinical-audit")} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            Clinical Audit Page
          </button>
        </div>
      </div>
    </div>
  );
}

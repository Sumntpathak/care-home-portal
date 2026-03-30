import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* ──────────────────────────────────────────────
   KNOWLEDGE BASE — covers every module
   ────────────────────────────────────────────── */
const KNOWLEDGE = {
  overview: {
    keywords: ["what", "about", "platform", "shanti", "features", "do", "help"],
    answer:
      "Shanti Care is a complete nursing home & OPD management platform with 23 modules, 4 safety engines, and clinical-grade decision support. I can help you navigate any feature. What would you like to know?",
  },

  pages: {
    dashboard: {
      keywords: ["dashboard", "home", "overview", "stats", "kpi"],
      path: "/",
      title: "Dashboard",
      answer:
        "The Dashboard shows your key metrics \u2014 residents, bed occupancy, today\u2019s appointments, revenue, and incidents. If you\u2019re an Admin, you\u2019ll also see the Clinical Standards & Safety Standards card at the bottom.",
      tips: [
        "Click any stat card to navigate to its detail page",
        "The quick actions bar gives you one-tap access to Daily Care, Med Rounds, Handover, and Incidents",
      ],
    },
    appointments: {
      keywords: [
        "appointment",
        "opd",
        "book",
        "schedule",
        "reception",
        "patient visit",
      ],
      path: "/appointments",
      title: "OPD Appointments",
      answer:
        "Create OPD appointments, generate receipts, and manage the patient queue. Click \u2018New Appointment\u2019 to start. After creation, a professional A4 receipt is generated automatically.",
      tips: [
        "Use \u2018Full Receipt\u2019 button for the unified receipt with diet plan & health advisory",
        "Click \u2018\u2192 Doctor\u2019 to send patient to doctor\u2019s queue",
        "Search by patient name, receipt number, or doctor",
      ],
    },
    prescriptions: {
      keywords: ["prescribe", "prescription", "medicine", "rx", "drug"],
      path: "/prescriptions",
      title: "Prescriptions",
      answer:
        "Doctors write prescriptions here. The system includes a 5-pass drug interaction checker (FDA rules, CYP450 enzymes, P-gp/OATP transporters, opposing forces, QT synergy) and shows in-stock medicine suggestions.",
      tips: [
        "Type medicine names to see auto-suggestions from inventory",
        "Drug interactions are checked in real-time as you type",
        "After saving, an auto-generated diet plan and health advisory appear",
      ],
    },
    homeCare: {
      keywords: [
        "home care",
        "daily care",
        "care notes",
        "vitals",
        "admitted",
        "resident",
        "nursing",
      ],
      path: "/home-care",
      title: "Home Care / Daily Care Notes",
      answer:
        "Track admitted patients with daily vitals, medications, observations, and nursing notes. Click \u2018Notes\u2019 on any patient to add today\u2019s entry. Click \u2018Diet\u2019 for an auto-generated diet plan based on their condition.",
      tips: [
        "Vitals trend charts appear automatically after 2+ notes",
        "Click \u2018Discharge\u2019 to generate a complete patient file",
        "The diet plan adapts to multiple conditions (e.g., CKD + Diabetes + Gout)",
      ],
    },
    billing: {
      keywords: [
        "billing",
        "invoice",
        "payment",
        "revenue",
        "fee",
        "money",
        "charge",
      ],
      path: "/billing",
      title: "Billing",
      answer:
        "View all billing records, track payments (paid/pending), and generate monthly invoices. Click \u2018Monthly Invoice\u2019 to create an itemized invoice with room charges, consultations, medications, GST breakdown, and payment history.",
      tips: [
        "Invoices include GST calculation (18% services, 5% medicines)",
        "Amount shown in words (Indian numbering)",
        "Bank details included for payment",
      ],
    },
    staffManagement: {
      keywords: [
        "staff",
        "user",
        "employee",
        "add staff",
        "remove staff",
        "password",
        "salary",
      ],
      path: "/users",
      title: "Staff Management",
      answer:
        "Add, edit, remove staff members. Reset passwords, manage shifts, generate salary slips. The activity log at the bottom shows login/logout history.",
      tips: [
        "Click the status badge to toggle Active/Inactive",
        "4 actions per staff: Edit, Reset Password, Salary, Remove",
        "Filter by role: All, Admin, Doctors, Staff",
      ],
    },
    dutyRoster: {
      keywords: [
        "duty",
        "roster",
        "schedule",
        "shift",
        "auto generate",
        "absence",
      ],
      path: "/duty-roster",
      title: "Duty Roster",
      answer:
        "Weekly staff scheduling with auto-generation. Click \u2018Auto Generate\u2019 to create a roster based on staff preferences. Mark absences and the system auto-suggests replacements.",
      tips: [
        "Navigate weeks with Prev/Next buttons",
        "Click any staff chip to mark absent or restore",
        "The system finds replacements from same role with fewest shifts",
      ],
    },
    reports: {
      keywords: [
        "report",
        "analytics",
        "chart",
        "graph",
        "consultant fee",
        "medicine sales",
      ],
      path: "/reports",
      title: "Reports & Analytics",
      answer:
        "Comprehensive analytics with period filtering (Today/Week/Month/All). Tabs: Overview, Consultant Fees (revenue per doctor), Medicine Sales (prescription analytics), Financial, Safety, Operations.",
      tips: [
        "Use the period selector to filter data",
        "Consultant Fees tab shows revenue per doctor and department",
        "Medicine Sales shows most prescribed drugs and revenue",
      ],
    },
    beds: {
      keywords: ["bed", "room", "occupancy", "ward", "admit"],
      path: "/beds",
      title: "Bed Management",
      answer:
        "Visual room map showing bed status (Occupied/Available/Maintenance). Add rooms, add beds, change status. Click a bed to toggle its status.",
      tips: [
        "Add Room auto-creates beds based on type (Single=1, Double=2)",
        "Can\u2019t delete a room with occupied beds",
        "The occupancy bar shows fill rate at a glance",
      ],
    },
    shiftHandover: {
      keywords: [
        "handover",
        "shift",
        "isbar",
        "nurse",
        "auto handover",
      ],
      path: "/shift-handover",
      title: "Shift Handover",
      answer:
        "Record and view shift handovers. Click \u2018Auto Handover\u2019 for an auto-generated summary using the ISBAR framework (NHS standard). It pulls today\u2019s care notes, med compliance, and incidents automatically.",
      tips: [
        "Auto Handover generates critical alerts, patient updates, and pending tasks",
        "Click \u2018Use This Handover\u2019 to pre-fill the form",
        "The medication compliance bar shows given/pending/missed",
      ],
    },
    dispensary: {
      keywords: ["dispensary", "dispense", "pharmacy", "fulfil"],
      path: "/dispensary",
      title: "Dispensary",
      answer:
        "View prescriptions waiting to be dispensed. Mark as dispensed when medications are given to the patient. The receipt updates automatically.",
    },
    medicines: {
      keywords: ["medicine", "stock", "inventory", "low stock", "drug"],
      path: "/medicines",
      title: "Medicine Inventory",
      answer:
        "Manage medicine stock \u2014 add, edit, track quantities. Low stock alerts appear when stock falls below minimum. Expiry tracking included.",
    },
    visitors: {
      keywords: ["visitor", "visit", "family visit", "check in"],
      path: "/visitors",
      title: "Visitor Log",
      answer:
        "Log visitor check-ins and check-outs. Track visitor name, relationship, patient visited, health screening, and badge number.",
    },
    incidents: {
      keywords: [
        "incident",
        "fall",
        "emergency",
        "accident",
        "report incident",
      ],
      path: "/incidents",
      title: "Incidents",
      answer:
        "Log and track incidents \u2014 falls, medical emergencies, medication errors, behavioral events. Track severity, actions taken, and follow-up.",
    },
    carePlans: {
      keywords: ["care plan", "treatment plan", "goals"],
      path: "/care-plans",
      title: "Care Plans",
      answer:
        "Create comprehensive care plans for residents \u2014 diagnosis, goals, medications, activities, dietary plans, and special instructions.",
    },
    dietary: {
      keywords: ["dietary", "diet plan", "meal", "nutrition", "food"],
      path: "/dietary",
      title: "Dietary Management",
      answer:
        "Manage dietary plans for residents. The diet safety engine auto-generates plans for 14 conditions with Indian meals. Handles multi-condition conflicts (e.g., CKD protein paradox).",
    },
    medSchedule: {
      keywords: [
        "med schedule",
        "medication round",
        "med round",
        "give medicine",
      ],
      path: "/med-schedule",
      title: "Medication Schedule",
      answer:
        "Track daily medication administration \u2014 which meds are given, pending, or missed. Mark meds as given with one click.",
    },
    familyPortal: {
      keywords: [
        "family",
        "family portal",
        "update family",
        "notify family",
      ],
      path: "/family-updates",
      title: "Family Portal",
      answer:
        "Send updates to patient families \u2014 daily reports, incident notifications, medical updates. Families can see their loved one\u2019s status.",
    },
  },

  engines: {
    drugChecker: {
      keywords: [
        "drug interaction",
        "drug check",
        "interaction",
        "5 pass",
        "cyp450",
        "transporter",
        "qt",
      ],
      answer:
        "Our 5-pass drug interaction checker:\n\u2022 Pass 1: Direct FDA rules (40+ interactions)\n\u2022 Pass 2: CYP450 metabolic pathways (90+ drugs, 5 enzymes)\n\u2022 Pass 3: P-gp & OATP transporters (catches the Rosuvastatin trap)\n\u2022 Pass 4: Opposing forces detection (inducer vs inhibitor conflicts)\n\u2022 Pass 5: QT prolongation synergy (17 drugs, Torsades de Pointes alert)\n\nPlus OpenFDA API verification when online. Try it in Prescriptions!",
    },
    dietEngine: {
      keywords: [
        "diet engine",
        "auto diet",
        "auto diet",
        "protein paradox",
        "levodopa",
      ],
      answer:
        "The Diet Safety Engine covers 14 conditions with priority-based merging:\n\u2022 CKD: Leached rice, low K+/PO4, no palak/spinach\n\u2022 Diabetes: Low GI, barley over white rice\n\u2022 Gout: Low purine, cherries, skim dairy\n\u2022 Liver + CKD: Protein paradox resolved (0.8\u20131.0g/kg vegetable protein + BCAA)\n\u2022 Parkinson\u2019s: Protein redistribution for Levodopa timing\n\nHandles misspellings (suger, arthrits) and Hindi terms (madhumeh, gathiya).",
    },
    vitalsAnalyzer: {
      keywords: [
        "vitals",
        "bp",
        "blood pressure",
        "glucose",
        "spo2",
        "sepsis",
        "qsofa",
      ],
      answer:
        "Condition-aware vitals analysis:\n\u2022 Age-adjusted BP targets (JNC-8: under 150/90 for \u226560)\n\u2022 Hypoglycemic tachycardia correlation (Glucose \u226470 + HR \u2265100)\n\u2022 Fluid overload detection for CKD/HF patients\n\u2022 qSOFA sepsis screening (BP \u2264100 + HR \u2265100 + Fever)\n\u2022 Over-medication detection (elderly low BP + bradycardia)\n\u2022 Cardiorenal Syndrome Type 5 detection",
    },
    handoverEngine: {
      keywords: [
        "auto handover",
        "handover engine",
        "isbar",
        "nurse handover",
      ],
      answer:
        "Auto-generates shift handover using ISBAR framework (NHS standard):\n\u2022 Identify: Shift info, who\u2019s handing over\n\u2022 Situation: Ward status, critical patients\n\u2022 Background: Key events during shift\n\u2022 Assessment: Patient-by-patient status\n\u2022 Recommendation: Pending tasks for incoming shift\n\nPulls from actual care notes, med schedules, and incidents. Go to Shift Handover \u2192 Auto Handover.",
    },
  },

  faq: {
    demoLogin: {
      keywords: ["login", "demo", "test", "try", "password", "credential"],
      answer:
        "Click any demo button on the login page:\n\u2022 Admin \u2014 full access to all modules\n\u2022 Doctor \u2014 patient queue, prescriptions, safety tools\n\u2022 Nurse \u2014 daily care, med rounds, handover\n\u2022 Reception \u2014 appointments, receipts\n\u2022 Pharmacy \u2014 dispensary, medicine stock",
    },
    howToStart: {
      keywords: [
        "start",
        "begin",
        "first",
        "new",
        "how to use",
        "getting started",
      ],
      answer:
        "Here\u2019s the typical workflow:\n1. Reception creates appointment (OPD Appointments)\n2. Patient sent to doctor (\u2192 Doctor button)\n3. Doctor writes prescription (with drug interaction check)\n4. Dispensary fulfills prescription\n5. Complete receipt generated automatically\n\nFor admitted patients: Home Care \u2192 Admit Patient \u2192 Daily Notes \u2192 Discharge with complete file.",
    },
    mobile: {
      keywords: ["mobile", "phone", "tablet", "responsive"],
      answer:
        "Yes! Shanti Care works on any device. On mobile, tap the \u2261 menu button to open the sidebar. All features work on phone/tablet.",
    },
    darkMode: {
      keywords: ["dark mode", "theme", "light mode", "night"],
      answer:
        "Click the sun/moon icon in the top-right corner of the topbar to toggle between light and dark mode. Your preference is saved automatically.",
    },
    security: {
      keywords: [
        "security",
        "safe",
        "privacy",
        "data",
        "encrypt",
        "hipaa",
      ],
      answer:
        "Security features:\n\u2022 Encrypted localStorage (auth data)\n\u2022 Session timeout (30 min inactivity)\n\u2022 Rate limiting on login (5 attempts/15 min)\n\u2022 Input validation & XSS sanitization\n\u2022 Audit trail for all engine calls\n\u2022 Clinical disclaimer on all engine outputs\n\nRegulatory: CDSS classification under MDR 2017. Not a Medical Device.",
    },
    contact: {
      keywords: ["contact", "call", "phone", "support", "help"],
      answer:
        "Contact us:\nPhone: 6265846547\nWhatsApp: wa.me/916265846547\nEmail: info@shanticarehome.in",
    },
  },
};

/* ──────────────────────────────────────────────
   PATH-TO-KEY MAP  (context-aware help)
   ────────────────────────────────────────────── */
const PATH_MAP = {
  "/": "dashboard",
  "/appointments": "appointments",
  "/prescriptions": "prescriptions",
  "/home-care": "homeCare",
  "/billing": "billing",
  "/users": "staffManagement",
  "/duty-roster": "dutyRoster",
  "/reports": "reports",
  "/beds": "beds",
  "/shift-handover": "shiftHandover",
  "/dispensary": "dispensary",
  "/medicines": "medicines",
  "/visitors": "visitors",
  "/incidents": "incidents",
  "/care-plans": "carePlans",
  "/dietary": "dietary",
  "/med-schedule": "medSchedule",
  "/family-updates": "familyPortal",
};

/* ──────────────────────────────────────────────
   MATCHING LOGIC
   ────────────────────────────────────────────── */
// Meta-queries that map to special answers
const META_QUERIES = {
  "show safety engines": {
    answer: "Shanti Care has 4 safety engines:\n\n1. Drug Interaction Checker — 5-pass analysis (Rules → CYP450 → Transporters → Opposing Forces → QT Synergy)\n\n2. Diet Engine — 14 conditions, priority-based merge, protein paradox resolution\n\n3. Vitals Analyzer — Age-adjusted, qSOFA sepsis screening, fluid overload detection\n\n4. Handover Engine — ISBAR framework, auto-generated from care data\n\nAsk me about any specific engine for details!",
    suggestions: ["Drug interaction checker", "Diet engine details", "Vitals analyzer", "Handover engine"],
  },
  "what modules exist": {
    answer: "Shanti Care has 23 modules:\n\n• Dashboard & Reports\n• OPD: Appointments, Prescriptions, Dispensary\n• Care: Home Care, Care Plans, Med Schedule, Dietary\n• Operations: Beds, Visitors, Incidents, Shift Handover\n• Admin: Staff, Billing, Duty Roster\n• Family Portal, Medical Files, Patient Portal\n\nAsk me about any module!",
    suggestions: ["Appointments", "Home Care", "Staff Management", "Billing"],
  },
  "all features": {
    answer: "Key features:\n\n• 5-Pass Drug Interaction Checker (FDA + CYP450 + Transporters)\n• Diet Safety Engine (14 conditions, Indian meals)\n• Vitals Trend Analysis (qSOFA, cardiorenal)\n• Auto Nurse Handover (ISBAR)\n• Unified A4 Receipt (reception → doctor → dispensary)\n• Complete Discharge File\n• Auto Duty Roster\n• Monthly Invoice Generator\n\nWhat would you like to explore?",
    suggestions: ["Drug checker", "Diet engine", "Show appointments", "Billing"],
  },
};

function findAnswer(query, pathname) {
  const q = query.toLowerCase().trim();

  // Check meta-queries first (exact/fuzzy)
  for (const [key, val] of Object.entries(META_QUERIES)) {
    if (q.includes(key) || key.includes(q) || q.replace(/[?!.,]/g, "").trim() === key) {
      return val;
    }
  }

  // Generic help based on current page
  const genericHelp = /^(help|what is this|where am i|this page|guide)\s*\??$/.test(q);
  if (genericHelp && pathname) {
    const key = PATH_MAP[pathname];
    if (key && KNOWLEDGE.pages[key]) return KNOWLEDGE.pages[key];
  }

  // Score-based matching across all knowledge
  let bestMatch = null;
  let bestScore = 0;

  const searchIn = (obj) => {
    for (const [, item] of Object.entries(obj)) {
      if (!item.keywords) continue;
      let score = 0;
      const words = q.split(/\s+/);
      for (const kw of item.keywords) {
        if (q === kw) { score += 20; continue; } // exact match
        if (q.includes(kw)) { score += kw.length * 2; continue; } // substring
        // Word-level matching
        for (const w of words) {
          if (w === kw) { score += 8; }
          else if (kw.includes(w) && w.length > 2) { score += w.length; }
          else if (w.includes(kw) && kw.length > 2) { score += kw.length; }
        }
      }
      // Also check title if page
      if (item.title && q.includes(item.title.toLowerCase())) score += 15;
      if (score > bestScore) { bestScore = score; bestMatch = item; }
    }
  };

  searchIn(KNOWLEDGE.pages);
  searchIn(KNOWLEDGE.engines);
  searchIn(KNOWLEDGE.faq);
  searchIn({ overview: KNOWLEDGE.overview });

  // Minimum threshold — don't match on very weak scores
  if (bestScore < 3) return null;

  return bestMatch;
}

/* ──────────────────────────────────────────────
   CONTEXT-AWARE SUGGESTIONS
   ────────────────────────────────────────────── */
function getSuggestions(pathname) {
  const base = ["How do I start?", "Show safety engines", "What modules exist?"];
  const key = PATH_MAP[pathname];
  if (!key) return base;

  const page = KNOWLEDGE.pages[key];
  if (!page) return base;

  const contextual = [`Tell me about ${page.title}`];
  if (page.tips && page.tips.length > 0) contextual.push(`Tips for ${page.title}`);
  contextual.push("Show all modules");
  return contextual;
}

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */
export default function AIGuide() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I\u2019m your Shanti Care guide. Ask me anything about the platform \u2014 features, navigation, safety engines, or how to get started.",
      suggestions: ["How do I start?", "Show safety engines", "What modules exist?"],
    },
  ]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const processQuery = useCallback(
    (text) => {
      const q = text.trim();
      if (!q) return;

      // Add user message
      setMessages((prev) => [...prev, { role: "user", text: q }]);

      // Find answer
      const match = findAnswer(q, location.pathname);

      if (match) {
        let responseText = match.answer;
        if (match.tips && match.tips.length > 0) {
          responseText += "\n\nTips:\n" + match.tips.map((t) => `\u2022 ${t}`).join("\n");
        }

        const botMsg = {
          role: "bot",
          text: responseText,
          path: match.path || null,
          title: match.title || null,
          suggestions: getSuggestions(location.pathname),
        };

        setTimeout(() => {
          setMessages((prev) => [...prev, botMsg]);
        }, 300);
      } else {
        // No match — helpful fallback
        const fallback = {
          role: "bot",
          text: "I\u2019m not sure about that one. Here are some things I can help with:",
          suggestions: [
            "How do I start?",
            "Show safety engines",
            "Tell me about prescriptions",
            "Billing help",
            "What about security?",
            "Contact support",
          ],
        };
        setTimeout(() => {
          setMessages((prev) => [...prev, fallback]);
        }, 300);
      }
    },
    [location.pathname]
  );

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    processQuery(input);
    setInput("");
  }, [input, processQuery]);

  const handleSuggestion = useCallback(
    (text) => {
      processQuery(text);
    },
    [processQuery]
  );

  /* ── Styles ─────────────────────────────── */
  const isMobile = typeof window !== "undefined" && window.innerWidth < 480;

  const floatingBtnStyle = {
    position: "fixed",
    bottom: 20,
    right: 20,
    zIndex: 9999,
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "var(--primary, #111)",
    color: "#fff",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 12px rgba(0,0,0,.15)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };

  const panelStyle = {
    position: "fixed",
    bottom: isMobile ? 0 : 20,
    right: isMobile ? 0 : 20,
    zIndex: 9999,
    width: isMobile ? "100%" : 380,
    maxHeight: isMobile ? "100vh" : "70vh",
    height: isMobile ? "100vh" : "auto",
    borderRadius: isMobile ? 0 : 16,
    background: "var(--surface, #fff)",
    border: "1px solid var(--border, #e5e7eb)",
    boxShadow: "0 8px 32px rgba(0,0,0,.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const headerStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid var(--border, #f3f4f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  };

  const messagesContainerStyle = {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const inputBarStyle = {
    padding: "10px 12px",
    borderTop: "1px solid var(--border, #f3f4f6)",
    display: "flex",
    gap: 8,
    flexShrink: 0,
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={floatingBtnStyle}
          aria-label="Open Guide"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.15)";
          }}
        >
          <MessageCircle size={20} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={panelStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={14} color="#fff" />
              </div>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--text, #111)",
                }}
              >
                Shanti Guide
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "#10b981",
                  fontWeight: 500,
                }}
              >
                Online
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Close Guide"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={messagesContainerStyle}>
            {messages.map((msg, i) => (
              <div key={i}>
                {/* Message bubble */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "bot" && (
                    <Bot
                      size={16}
                      style={{
                        color: "#9ca3af",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                  )}
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "8px 12px",
                      borderRadius: 12,
                      fontSize: 13,
                      lineHeight: 1.6,
                      whiteSpace: "pre-line",
                      background:
                        msg.role === "user"
                          ? "var(--primary, #111)"
                          : "var(--border, #f9fafb)",
                      color:
                        msg.role === "user"
                          ? "#fff"
                          : "var(--text, #374151)",
                      borderBottomRightRadius:
                        msg.role === "user" ? 4 : 12,
                      borderBottomLeftRadius:
                        msg.role === "bot" ? 4 : 12,
                    }}
                  >
                    {msg.text}
                  </div>
                  {msg.role === "user" && (
                    <User
                      size={16}
                      style={{
                        color: "#9ca3af",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                  )}
                </div>

                {/* Navigation button */}
                {msg.path && (
                  <button
                    onClick={() => {
                      navigate(msg.path);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 8,
                      marginLeft: 24,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border, #e5e7eb)",
                      background: "var(--surface, #fff)",
                      color: "var(--primary, #111)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--border, #f3f4f6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface, #fff)";
                    }}
                  >
                    <ChevronRight size={14} />
                    Go to {msg.title}
                  </button>
                )}

                {/* Suggestion chips */}
                {msg.suggestions && (
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginTop: 8,
                      marginLeft: 24,
                    }}
                  >
                    {msg.suggestions.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => handleSuggestion(s)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          border: "1px solid var(--border, #e5e7eb)",
                          background: "var(--surface, #fff)",
                          color: "var(--text, #374151)",
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--primary, #111)";
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.borderColor = "var(--primary, #111)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--surface, #fff)";
                          e.currentTarget.style.color = "var(--text, #374151)";
                          e.currentTarget.style.borderColor = "var(--border, #e5e7eb)";
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div style={inputBarStyle}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything..."
              style={{
                flex: 1,
                border: "1px solid var(--border, #e5e7eb)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                outline: "none",
                background: "var(--surface, #fff)",
                color: "var(--text, #374151)",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--primary, #111)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border, #e5e7eb)";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "none",
                background: input.trim()
                  ? "var(--primary, #111)"
                  : "var(--border, #e5e7eb)",
                color: input.trim() ? "#fff" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() ? "pointer" : "not-allowed",
                transition: "background 0.15s ease",
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

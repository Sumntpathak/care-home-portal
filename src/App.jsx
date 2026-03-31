import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Critical path — login only (smallest possible initial bundle)
import Login from "./pages/Login";

// Lazy-loaded — everything else loads on demand
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Users = lazy(() => import("./pages/Users"));
const Patients = lazy(() => import("./pages/Patients"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const Appointments = lazy(() => import("./pages/Appointments"));
const DoctorAppts = lazy(() => import("./pages/DoctorAppts"));
const PrescribeForm = lazy(() => import("./pages/PrescribeForm"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const Dispensary = lazy(() => import("./pages/Dispensary"));
const Medicines = lazy(() => import("./pages/Medicines"));
const Billing = lazy(() => import("./pages/Billing"));
const DutyRoster = lazy(() => import("./pages/DutyRoster"));
const HomeCare = lazy(() => import("./pages/HomeCare"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const MedicalFile = lazy(() => import("./pages/MedicalFile"));
const Incidents = lazy(() => import("./pages/Incidents"));
const BedManagement = lazy(() => import("./pages/BedManagement"));
const VisitorLog = lazy(() => import("./pages/VisitorLog"));
const ShiftHandover = lazy(() => import("./pages/ShiftHandover"));
const CarePlans = lazy(() => import("./pages/CarePlans"));
const DietaryManagement = lazy(() => import("./pages/DietaryManagement"));
const MedSchedule = lazy(() => import("./pages/MedSchedule"));
const FamilyPortal = lazy(() => import("./pages/FamilyPortal"));
const Reports = lazy(() => import("./pages/Reports"));
const MaternityCare = lazy(() => import("./pages/MaternityCare"));
const SyncStatus = lazy(() => import("./pages/SyncStatus"));
const LabModule = lazy(() => import("./pages/LabModule"));
const RadiologyModule = lazy(() => import("./pages/RadiologyModule"));
const ClinicalAudit = lazy(() => import("./pages/ClinicalAudit"));
const DoctorRegistration = lazy(() => import("./pages/DoctorRegistration"));
const DoctorOnboarding = lazy(() => import("./pages/DoctorOnboarding"));
const DoctorTestingDashboard = lazy(() => import("./pages/DoctorTestingDashboard"));

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  // Require valid user with name and role — stale/empty sessions redirect to login
  return (user && user.name && user.role) ? children : <Navigate to="/landing" replace />;
}

function RoleGuard({ allowed, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/landing" replace />;
  if (allowed && !allowed.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Tiny inline loader — only shows in the content area, sidebar/topbar stay visible
function PageFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px", opacity: 0.3 }}>
      <span className="spinner" />
    </div>
  );
}

// Wrap lazy components with their own Suspense so Layout never unmounts
function Lazy({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export default function App() {
  const { user } = useAuth();

  if (user?.role === "Patient") {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="*" element={<PatientPortal />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Routes>
      <Route path="/landing" element={<Lazy><Landing /></Lazy>} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={<Lazy><DoctorRegistration /></Lazy>} />
      <Route path="/doctor-onboarding" element={<Lazy><DoctorOnboarding /></Lazy>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Lazy><Dashboard /></Lazy>} />
        <Route path="users"                element={<RoleGuard allowed={["Admin"]}><Lazy><Users /></Lazy></RoleGuard>} />
        <Route path="salary"               element={<RoleGuard allowed={["Admin"]}><Lazy><Users /></Lazy></RoleGuard>} />
        <Route path="patients"             element={<Lazy><Patients /></Lazy>} />
        <Route path="patients/:id"         element={<Lazy><PatientDetail /></Lazy>} />
        <Route path="appointments"         element={<Lazy><Appointments /></Lazy>} />
        <Route path="doctor-appointments"  element={<Lazy><DoctorAppts /></Lazy>} />
        <Route path="prescribe/:receiptNo" element={<Lazy><PrescribeForm /></Lazy>} />
        <Route path="prescriptions"        element={<Lazy><Prescriptions /></Lazy>} />
        <Route path="dispensary"           element={<Lazy><Dispensary /></Lazy>} />
        <Route path="medicines"            element={<Lazy><Medicines /></Lazy>} />
        <Route path="billing"              element={<RoleGuard allowed={["Admin"]}><Lazy><Billing /></Lazy></RoleGuard>} />
        <Route path="home-care"            element={<Lazy><HomeCare /></Lazy>} />
        <Route path="duty-roster"          element={<Lazy><DutyRoster /></Lazy>} />
        <Route path="medical-file"         element={<Lazy><MedicalFile /></Lazy>} />
        <Route path="incidents"            element={<Lazy><Incidents /></Lazy>} />
        <Route path="beds"                 element={<Lazy><BedManagement /></Lazy>} />
        <Route path="visitors"             element={<Lazy><VisitorLog /></Lazy>} />
        <Route path="shift-handover"       element={<Lazy><ShiftHandover /></Lazy>} />
        <Route path="care-plans"           element={<Lazy><CarePlans /></Lazy>} />
        <Route path="dietary"              element={<Lazy><DietaryManagement /></Lazy>} />
        <Route path="med-schedule"         element={<Lazy><MedSchedule /></Lazy>} />
        <Route path="family-updates"       element={<Lazy><FamilyPortal /></Lazy>} />
        <Route path="reports"              element={<RoleGuard allowed={["Admin"]}><Lazy><Reports /></Lazy></RoleGuard>} />
        <Route path="maternity"            element={<Lazy><MaternityCare /></Lazy>} />
        <Route path="sync-status" element={<Lazy><SyncStatus /></Lazy>} />
        <Route path="lab" element={<Lazy><LabModule /></Lazy>} />
        <Route path="radiology" element={<Lazy><RadiologyModule /></Lazy>} />
        <Route path="clinical-audit" element={<RoleGuard allowed={["Admin","Doctor"]}><Lazy><ClinicalAudit /></Lazy></RoleGuard>} />
        <Route path="doctor-testing" element={<Lazy><DoctorTestingDashboard /></Lazy>} />
      </Route>
      <Route path="*" element={user ? <Navigate to="/" replace /> : <Navigate to="/landing" replace />} />
    </Routes>
  );
}

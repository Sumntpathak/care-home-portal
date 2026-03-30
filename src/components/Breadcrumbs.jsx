import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS = {
  "": "Dashboard",
  "patients": "Patients",
  "home-care": "Home Care",
  "care-plans": "Care Plans",
  "med-schedule": "Med Schedule",
  "dietary": "Dietary",
  "medical-file": "Medical File",
  "beds": "Bed Management",
  "incidents": "Incidents",
  "visitors": "Visitor Log",
  "shift-handover": "Shift Handover",
  "family-updates": "Family Portal",
  "appointments": "Appointments",
  "prescriptions": "Prescriptions",
  "dispensary": "Dispensary",
  "medicines": "Medicines",
  "users": "Users",
  "billing": "Billing",
  "duty-roster": "Duty Roster",
  "reports": "Reports",
  "doctor-appointments": "Doctor Queue",
  "prescribe": "Prescribe",
  "patient": "Patient Detail",
  "maternity": "Maternity & IVF Care",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className="breadcrumbs no-print" aria-label="Breadcrumb">
      <Link to="/" className="breadcrumb-item breadcrumb-home">
        <Home size={13} />
        <span>Home</span>
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="breadcrumb-segment">
          <ChevronRight size={12} className="breadcrumb-sep" />
          {crumb.isLast ? (
            <span className="breadcrumb-item breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="breadcrumb-item">{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

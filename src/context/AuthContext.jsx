import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { logStaffAction, authLogout, authMe } from "../api/sheets";
import { secureGet, secureSet, secureRemove, initSession } from "../utils/security";
import { clearKeys } from "../lib/dbCrypto";

const AuthContext = createContext(null);

// Check if running in demo mode
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // In demo mode, restore from localStorage
    if (DEMO_MODE) return secureGet("ch_user");
    return null; // In production, we'll verify via /api/auth/me
  });
  const [sessionWarning, setSessionWarning] = useState(0);
  const [loading, setLoading] = useState(!DEMO_MODE); // loading state for production auth check

  // In production mode, verify session on mount via /api/auth/me
  useEffect(() => {
    if (DEMO_MODE) return;

    authMe()
      .then((userData) => {
        if (userData && userData.id) {
          setUser(userData);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // In demo mode, persist user to localStorage
  useEffect(() => {
    if (!DEMO_MODE) return;
    if (user) secureSet("ch_user", user);
    else secureRemove("ch_user");
  }, [user]);

  // Listen for auth:logout events (from API client on 401)
  useEffect(() => {
    const handler = () => logoutFn();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  // Session timeout — auto-logout after 30 min inactivity
  useEffect(() => {
    if (!user) return;
    const cleanup = initSession(
      (secondsLeft) => setSessionWarning(secondsLeft),
      () => { logoutFn(); }
    );
    return cleanup;
  }, [user]);

  const loginUser = useCallback((u) => {
    setSessionWarning(0);
    setUser(u);
    // Pre-cache critical data for offline use
    import("../api/sheets").then(({ precacheAll, getPatients, getMedicines, getMedSchedule, getCarePlans, getAppointments, getIncidents, getRooms, getHomeCarePatients }) => {
      if (!precacheAll) return;
      precacheAll({
        patients: getPatients,
        medicines: getMedicines,
        medSchedule: getMedSchedule,
        carePlans: getCarePlans,
        appointments: () => getAppointments("all"),
        incidents: getIncidents,
        rooms: getRooms,
        homeCareNotes: getHomeCarePatients,
      }).catch(() => {});
    });
    // Start real-time sync with other devices
    import("../lib/liveSync").then(({ connect }) => connect()).catch(() => {});
  }, []);

  const logoutFn = useCallback(() => {
    setUser(prev => {
      if (prev) {
        logStaffAction({ name: prev.name, role: prev.role, action: "Logout" }).catch(() => {});
        if (!DEMO_MODE) authLogout().catch(() => {});
      }
      if (DEMO_MODE) secureRemove("ch_user");
        clearKeys();
        import("../lib/liveSync").then(({ disconnect }) => disconnect()).catch(() => {});
      return null;
    });
    setSessionWarning(0);
  }, []);

  const logout = logoutFn;

  const value = useMemo(() => ({
    user, loginUser, logout, sessionWarning, loading,
    isAdmin: user?.role === "Admin",
    isDoctor: user?.role === "Doctor",
    isStaff: user?.role === "Staff",
    isPatient: user?.role === "Patient",
    position: user?.position || "",
  }), [user, loginUser, logout, sessionWarning, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

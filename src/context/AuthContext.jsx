import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { logStaffAction, authLogout, authMe, login as apiLogin } from "../api/sheets";
import { secureGet, secureSet, secureRemove, initSession } from "../utils/security";
import { clearKeys } from "../lib/dbCrypto";
import { initSessionKey, clearSessionKey } from "../utils/sessionKeyManager";

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

    (async () => {
      try {
        const userData = await authMe();
        if (userData && userData.id) {
          await initSessionKey();
          setUser(userData);
          return;
        }
      } catch {}

      // No active session — dev auto-login as admin for instant preview
      if (import.meta.env.DEV) {
        try {
          const result = await apiLogin("pathaksumnt4u@gmail.com", "admin123");
          if (result?.user) {
            await initSessionKey();
            setUser(result.user);
            return;
          }
        } catch {}
        // API unreachable locally — fall back to mock admin for UI preview
        await initSessionKey();
        setUser({ id: "DEV-ADMIN", name: "Sumnt Pathak", role: "Admin", position: "Administrator", facilityId: "FAC-001", email: "pathaksumnt4u@gmail.com" });
      }
    })().finally(() => setLoading(false));
  }, []);

  // In demo mode, persist user to localStorage and init session key on mount restore
  useEffect(() => {
    if (!DEMO_MODE) return;
    if (user) {
      secureSet("ch_user", user);
      initSessionKey().catch(() => {});
    } else {
      secureRemove("ch_user");
    }
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

  // Clear session key if tab is hidden for >30 minutes
  const hiddenSince = useRef(null);
  useEffect(() => {
    if (!user) return;
    const BACKGROUND_TIMEOUT = 30 * 60 * 1000;
    const handler = () => {
      if (document.hidden) {
        hiddenSince.current = Date.now();
      } else {
        if (hiddenSince.current && Date.now() - hiddenSince.current > BACKGROUND_TIMEOUT) {
          clearSessionKey();
          clearKeys();
          logoutFn();
        }
        hiddenSince.current = null;
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [user]);

  const loginUser = useCallback(async (u) => {
    setSessionWarning(0);

    // Reset language to English on fresh login. Any stale googtrans cookie
    // from a previous session (or from landing-page browsing) is cleared so
    // the dashboard always starts in English. User can re-pick their
    // language from the topbar once inside.
    try {
      const hadGoogleTranslate = !!document.cookie.match(/googtrans=\/en\//);
      localStorage.removeItem("sc_language");
      document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "googtrans=;path=/;domain=" + location.hostname + ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
      var parts = location.hostname.split(".");
      if (parts.length > 1) {
        document.cookie = "googtrans=;path=/;domain=." + parts.slice(-2).join(".") + ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      // If Google Translate had been applied (DOM was mutated), we need a
      // one-time reload so the dashboard mounts on a clean untranslated tree.
      // Do the reload AFTER user state is stored so the session survives.
      if (hadGoogleTranslate) {
        setUser(u);
        await initSessionKey();
        setTimeout(() => location.reload(), 30);
        return;
      }
    } catch {}

    setUser(u);
    // Initialize non-extractable encryption key in memory
    await initSessionKey();
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
      clearSessionKey();
      clearKeys();
      import("../lib/liveSync").then(({ disconnect }) => disconnect()).catch(() => {});

      // Reset language to English so next login starts clean.
      try {
        localStorage.removeItem("sc_language");
        // Clear Google Translate cookies (both path and domain variants)
        document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "googtrans=;path=/;domain=" + location.hostname + ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
        // Also clear the parent-domain cookie for Cloudflare Pages preview subdomains
        var parts = location.hostname.split(".");
        if (parts.length > 1) {
          document.cookie = "googtrans=;path=/;domain=." + parts.slice(-2).join(".") + ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      } catch {}

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

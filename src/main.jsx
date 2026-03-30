import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import App from "./App";
import "./index.css";

// i18n — multi-language support (must import before rendering)
import "./i18n/index.js";

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "60px 40px", fontFamily: "'Inter', system-ui, sans-serif",
          maxWidth: "500px", margin: "80px auto", textAlign: "center"
        }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "16px",
            background: "linear-gradient(135deg, #d4685a, #c44)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", color: "#fff", fontSize: "28px"
          }}>!</div>
          <h2 style={{ color: "#2d3748", marginBottom: "12px", fontSize: "20px", fontWeight: 700 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#5a6a7e", marginBottom: "20px", fontSize: "14px", lineHeight: 1.6 }}>
            We encountered an unexpected error. Please try reloading the page.
          </p>
          <pre style={{
            background: "#fde8e5", padding: "14px", borderRadius: "10px",
            fontSize: "12px", overflowX: "auto", color: "#7f1d1d", marginBottom: "20px",
            border: "1px solid rgba(212,104,90,.2)", textAlign: "left"
          }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => window.location.reload()}
            style={{
              padding: "11px 24px", background: "linear-gradient(135deg, #4f8cdb, #3a6fb5)",
              color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
              fontSize: "14px", fontWeight: 600, fontFamily: "'Inter', sans-serif",
              boxShadow: "0 2px 8px rgba(79,140,219,.3)"
            }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Request persistent storage to prevent IndexedDB eviction
if (navigator.storage?.persist) {
  navigator.storage.persist().then(granted => {
    if (granted) console.log('[Storage] Persistent storage granted');
  });
}

// Start server discovery (LAN → Cloud → Offline)
import('./lib/serverDiscovery').then(({ startDiscovery }) => startDiscovery());

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldOff } from "lucide-react";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { signOut } from "./lib/auth";

import LandingPage from "./pages/LandingPage";
import AuthScreen from "./pages/AuthScreen";
import CreateGroupFlow from "./pages/CreateGroupFlow";
import JoinGroupFlow from "./pages/JoinGroupFlow";
import GroupChatInterface from "./pages/GroupChatInterface";
import GroupMembersPage from "./pages/GroupMembersPage";
import GroupAdminDashboard from "./pages/GroupAdminDashboard";
import UserProfile from "./pages/UserProfile";
import SearchDiscovery from "./pages/SearchDiscovery";
import NotificationsPage from "./pages/NotificationsPage";
import EmptyErrorStates from "./pages/EmptyErrorStates";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

function Screen({ children }) {
  return (
    <div className="app-screen" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(8px, 4vw, 24px)", background: "var(--bg)" }}>
      {children}
    </div>
  );
}

function BannedScreen() {
  return (
    <Screen>
      <div style={{ textAlign: "center", padding: 30, maxWidth: 340, fontFamily: "Inter, sans-serif" }}>
        <ShieldOff size={32} color="#E5484D" style={{ marginBottom: 12 }} />
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Account suspended</h2>
        <p style={{ color: "#8A8FB0", fontSize: 13.5, lineHeight: 1.5 }}>
          This account has been suspended from LINKCHAT. If you think this is a mistake, contact support.
        </p>
        <button
          onClick={() => signOut()}
          style={{ marginTop: 14, background: "#14142B", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Sign out
        </button>
      </div>
    </Screen>
  );
}

/** Wrap any route that requires a signed-in user. Redirects to /login and
 *  brings them right back here afterward, via the ?redirect= param.
 *  Also blocks entirely if the account is platform-banned. */
function RequireAuth({ children }) {
  const { user, loading, banned } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Screen><Loader2 size={24} color="#4338CA" style={{ animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></Screen>;
  }
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (banned) {
    return <BannedScreen />;
  }
  return children;
}

/** Gates /superadmin — only the designated creator account. Backed by real
 *  RLS (superadmin_schema.sql), not just this route check — this is a
 *  convenience gate for the UI, the database enforces the real boundary. */
function RequireSuperAdmin({ children }) {
  const { user, loading, isPlatformAdmin } = useAuth();
  if (loading) {
    return <Screen><Loader2 size={24} color="#4338CA" style={{ animation: "spin 0.8s linear infinite" }} /></Screen>;
  }
  if (!user || !isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Screen><LandingPage /></Screen>} />
          <Route path="/login" element={<Screen><AuthScreen /></Screen>} />
          <Route path="/signup" element={<Screen><AuthScreen /></Screen>} />
          <Route path="/join/:code" element={<Screen><JoinGroupFlow /></Screen>} />

          <Route path="/create" element={<RequireAuth><Screen><CreateGroupFlow /></Screen></RequireAuth>} />
          <Route path="/groups/:groupId" element={<RequireAuth><Screen><GroupChatInterface /></Screen></RequireAuth>} />
          <Route path="/groups/:groupId/members" element={<RequireAuth><Screen><GroupMembersPage /></Screen></RequireAuth>} />
          <Route path="/groups/:groupId/admin" element={<RequireAuth><Screen><GroupAdminDashboard /></Screen></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Screen><UserProfile /></Screen></RequireAuth>} />
          <Route path="/search" element={<RequireAuth><Screen><SearchDiscovery /></Screen></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><Screen><NotificationsPage /></Screen></RequireAuth>} />

          <Route path="/superadmin" element={<RequireSuperAdmin><Screen><SuperAdminDashboard /></Screen></RequireSuperAdmin>} />

          {/* dev-only reference sheet, not linked from anywhere in the UI */}
          <Route path="/dev/states" element={<Screen><EmptyErrorStates /></Screen>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";

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

function Screen({ children }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(8px, 4vw, 24px)", background: "var(--bg)" }}>
      {children}
    </div>
  );
}

/** Wrap any route that requires a signed-in user. Redirects to /login and
 *  brings them right back here afterward, via the ?redirect= param. */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Screen><Loader2 size={24} color="#4338CA" style={{ animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></Screen>;
  }
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
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

          {/* dev-only reference sheet, not linked from anywhere in the UI */}
          <Route path="/dev/states" element={<Screen><EmptyErrorStates /></Screen>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

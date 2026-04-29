import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import { useAuthStore } from "./store/auth.store.js";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ListPage from "./pages/ListPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";
import CampaignsPage from "./pages/CampaignsPage.jsx";
import CampaignDetailPage from "./pages/CampaignDetailPage.jsx";
import LeadsPage from "./pages/LeadsPage.jsx";
import LeadDetailPage from "./pages/LeadDetailPage.jsx";
import DuplicatesPage from "./pages/DuplicatesPage.jsx";
import ApplicationUploadPage from "./pages/ApplicationUploadPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import MasterDataPage from "./pages/MasterDataPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const qc = new QueryClient();

function RequireSession() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

function PasswordGate() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route element={<PasswordGate />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route
              path="campaigns"
              element={<CampaignsPage />}
            />
            <Route path="campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="duplicates" element={<DuplicatesPage />} />
            <Route path="applications/upload" element={<ApplicationUploadPage />} />
            <Route
              path="reports"
              element={<ReportsPage />}
            />
            <Route
              path="master-data"
              element={<MasterDataPage />}
            />
            <Route path="users" element={<ListPage title="Users" endpoint="/users" />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit-logs" element={<ListPage title="Audit Logs" endpoint="/audit-logs" />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

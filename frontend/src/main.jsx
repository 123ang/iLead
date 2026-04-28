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
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";

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
              element={
                <ListPage
                  title="Campaigns"
                  endpoint="/campaigns"
                  detailBase="/campaigns"
                />
              }
            />
            <Route
              path="campaigns/:id"
              element={<PlaceholderPage title="Campaign Detail" />}
            />
            <Route
              path="leads"
              element={
                <ListPage title="Leads" endpoint="/leads" detailBase="/leads" />
              }
            />
            <Route
              path="leads/:id"
              element={<PlaceholderPage title="Lead Detail" />}
            />
            <Route
              path="duplicates"
              element={
                <ListPage
                  title="Duplicate Lead Queue"
                  endpoint="/leads/duplicates"
                />
              }
            />
            <Route
              path="applications/upload"
              element={
                <PlaceholderPage title="Application / Offer / Enrolment Upload" />
              }
            />
            <Route
              path="reports"
              element={<PlaceholderPage title="Reports" />}
            />
            <Route
              path="master-data"
              element={<PlaceholderPage title="Master Data" />}
            />
            <Route path="users" element={<ListPage title="Users" endpoint="/users" />} />
            <Route path="settings" element={<ListPage title="Settings" endpoint="/settings" />} />
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

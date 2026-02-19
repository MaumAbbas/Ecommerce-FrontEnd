import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import SellerDashboard from "./pages/sellerDashboard";
import AdminDashboard from "./pages/adminDashboard";
import CustomerDashboard from "./pages/customerDashboard";
import DashboardRedirect from "./pages/dashboardRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import { clearStoredUser, restoreUserSession } from "./utils/auth";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    axios.defaults.withCredentials = true;
    let refreshPromise = null;

    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalConfig = error?.config || {};
        const status = error?.response?.status;
        const url = String(originalConfig?.url || "");
        const isRefreshRoute = url.includes("/api/auth/refresh-token");
        const isLoginRoute = url.includes("/api/auth/login");

        if (
          status === 401 &&
          !originalConfig._retry &&
          !isRefreshRoute &&
          !isLoginRoute
        ) {
          originalConfig._retry = true;
          try {
            if (!refreshPromise) {
              refreshPromise = axios
                .post(
                  `${API_BASE}/api/auth/refresh-token`,
                  {},
                  { withCredentials: true }
                )
                .finally(() => {
                  refreshPromise = null;
                });
            }
            await refreshPromise;
            return axios(originalConfig);
          } catch (refreshError) {
            clearStoredUser();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    const boot = async () => {
      await restoreUserSession();
      setAuthReady(true);
    };

    boot();

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, []);

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-wide">
          <h2 className="auth-heading">Restoring Session</h2>
          <p className="auth-sub">Checking your login securely...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<DashboardRedirect authReady={authReady} />} />

        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={["seller"]} authReady={authReady}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]} authReady={authReady}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]} authReady={authReady}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;

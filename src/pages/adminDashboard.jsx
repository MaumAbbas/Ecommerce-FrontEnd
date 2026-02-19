import React from "react";
import { useNavigate } from "react-router-dom";
import { clearStoredUser } from "../utils/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredUser();
    navigate("/login");
  };

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <div>
          <p className="dash-kicker">Admin Panel</p>
          <h1>Admin Dashboard</h1>
        </div>
        <button className="btn-ghost btn-inline" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="empty-state">
        <h2>Admin area is ready</h2>
        <p>
          Role based routing is active. Add your admin analytics and controls
          here.
        </p>
      </section>
    </div>
  );
};

export default AdminDashboard;


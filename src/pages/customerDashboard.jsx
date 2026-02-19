import React from "react";
import { useNavigate } from "react-router-dom";
import { clearStoredUser } from "../utils/auth";

const CustomerDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredUser();
    navigate("/login");
  };

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <div>
          <p className="dash-kicker">Customer Area</p>
          <h1>Customer Dashboard</h1>
        </div>
        <button className="btn-ghost btn-inline" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="empty-state">
        <h2>Welcome back</h2>
        <p>
          Role based routing is active. Add order history, profile, and cart
          details here.
        </p>
      </section>
    </div>
  );
};

export default CustomerDashboard;


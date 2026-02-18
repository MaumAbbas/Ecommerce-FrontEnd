// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-card">
        <p className="home-badge">EZStore</p>
        <h1>Welcome to EZStore</h1>
        <p className="home-subtitle">
          Discover great deals, fast delivery, and a smooth shopping experience.
        </p>
        <div className="home-actions">
          <button className="btn primary" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="btn ghost" onClick={() => navigate("/register")}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;

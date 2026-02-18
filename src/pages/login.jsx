import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = form.emailOrName.includes("@")
        ? { email: form.emailOrName.trim(), password: form.password }
        : { name: form.emailOrName.trim(), password: form.password };

      const res = await axios.post(`${API_BASE}/api/auth/login`, payload, {
        withCredentials: true,
      });

      setSuccess(res?.data?.message || "Login successful");
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">EZ</div>
        <h2 className="auth-heading">Welcome back</h2>
        <p className="auth-sub">Sign in to continue your shopping.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-label" htmlFor="emailOrName">
            Email or Username
          </label>
          <input
            id="emailOrName"
            name="emailOrName"
            type="text"
            placeholder="you@example.com or username"
            value={form.emailOrName}
            onChange={onChange}
            required
          />

          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={onChange}
            required
          />

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            <span>{loading ? "Signing in..." : "Login"}</span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>

        <div className="auth-alt">
          Don’t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

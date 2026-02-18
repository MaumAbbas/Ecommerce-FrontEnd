// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: "⚡",
    title: "Instant Ordering",
    desc: "Pick what you want, tap once, done. No friction, no confusion.",
  },
  {
    icon: "🚚",
    title: "Fast Delivery",
    desc: "Your order races to your door — tracked every mile of the way.",
  },
  {
    icon: "🛡️",
    title: "Secure & Trusted",
    desc: "Shop with confidence. Every transaction is encrypted and protected.",
  },
];

const floatingItems = ["👟", "🎧", "📦", "💻", "🧴", "🕶️"];

const Home = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home">
      {/* LEFT PANEL */}
      <div className="home-left">
        <div className="home-left-inner">
          <span className="badge">✦ EZStore</span>

          <h1 className="hero-title">
            Shop Smarter.<br />
            <span className="hero-accent">Live Better.</span>
          </h1>

          <p className="hero-desc">
            EZStore strips away the noise. Just browse, tap, and receive — 
            shopping so simple it feels like magic.
          </p>

          {/* Feature cards */}
          <div className="features">
            {features.map((f, i) => (
              <div
                key={i}
                className={`feature-card ${activeFeature === i ? "active" : ""}`}
                onMouseEnter={() => setActiveFeature(i)}
              >
                <span className="feature-icon">{f.icon}</span>
                <div>
                  <p className="feature-title">{f.title}</p>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="stats-row">
            <div className="stat">
              <span className="stat-num">50K+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">2M+</span>
              <span className="stat-label">Happy Shoppers</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">24/7</span>
              <span className="stat-label">Support</span>
            </div>
          </div>
        </div>

        {/* Floating emoji orbs */}
        <div className="float-bg" aria-hidden="true">
          {floatingItems.map((emoji, i) => (
            <span key={i} className={`float-item float-item-${i}`}>{emoji}</span>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="home-right">
        <div className="auth-card">
          <div className="auth-logo">EZ</div>
          <h2 className="auth-heading">Get Started</h2>
          <p className="auth-sub">
            Join millions who shop the easy way.
          </p>

          <div className="auth-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/login")}
            >
              <span>Login to your account</span>
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              className="btn-ghost"
              onClick={() => navigate("/register")}
            >
              Create a free account
            </button>
          </div>

          <p className="auth-terms">
            By signing up, you agree to our{" "}
            <a href="/terms">Terms</a> &amp; <a href="/privacy">Privacy Policy</a>.
          </p>

          <div className="trust-row">
            <span>🔒 SSL Encrypted</span>
            <span>✓ No spam</span>
            <span>✦ Free to join</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

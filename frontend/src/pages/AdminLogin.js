import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Demo credentials (you can change these):
  const DEMO_EMAIL = "tripayush746@gmail.com";
  const DEMO_PASSWORD = "admin4321";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedEmail === DEMO_EMAIL.toLowerCase() && normalizedPassword === DEMO_PASSWORD) {
      localStorage.setItem("isAdmin", "true");
      navigate("/admin", { replace: true });
    } else {
      setError("Invalid admin credentials.");
    }
  };

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <h2>Admin Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tripayush746@gmail.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button type="submit" className="btn primary">Sign In</button>
          <p className="hint">Demo: tripayush746@gmail.com / admin4321</p>
        </form>
      </div>
    </div>
  );
}

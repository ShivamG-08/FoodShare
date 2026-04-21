import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded admin credentials
  const ADMIN_EMAIL = "tripathiayush746@gmail.com";
  const ADMIN_PASSWORD = "Dhanapur@2024";

  const handleSubmit = async (e) => {
    console.log("Admin login form submitted");
    console.log("Email:", email);
    console.log("Password:", password);
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data && response.data.role === "admin") {
        // Store admin user data
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userEmail", response.data.user.email);
        localStorage.setItem("userName", response.data.user.name || "");
        
        navigate("/admin", { replace: true });
      } else {
        setError("Access denied. Admin role required.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid admin credentials.");
    } finally {
      setIsLoading(false);
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
              placeholder="tripathiayush746@gmail.com"
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
          <button type="submit" className="btn primary" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
          <p className="hint">Admin Credentials: tripathiayush746@gmail.com / Dhanapur@2024</p>
        </form>
      </div>
    </div>
  );
}

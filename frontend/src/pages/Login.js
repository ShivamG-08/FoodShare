import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requiredRole = params.get("role"); // 'receiver' | 'donor' | null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data && response.data.role) {
        // Enforce role if specified via query param BEFORE storing anything
        if (requiredRole && response.data.role !== requiredRole) {
          setError("Invalid credentials");
          return; // Do not store or navigate
        }

        // Store after role check passes
        localStorage.setItem("userRole", response.data.role);
        
        // Store JWT token for authentication
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        
        if (response.data.user) {
          localStorage.setItem("userId", response.data.user.id);
          localStorage.setItem("userEmail", response.data.user.email);
          localStorage.setItem("userName", response.data.user.name || "");
          // Persist profile image per-user so it's available across sessions and browsers
          try {
            const uid = response.data.user.id;
            const role = response.data.role;
            const key = uid ? `profileImage:${role}:${uid}` : 'profileImage:guest';
            const url = response.data.user.profileImageUrl || '';
            if (url) localStorage.setItem(key, url);
          } catch (_) {}
        }

        // Check if user is approved (except admin)
        if (response.data.role !== "admin") {
          // User can access dashboard if approved
          // The backend already validates approval status, so if we reach here, user is approved
          switch (response.data.role) {
            case "donor":
              navigate("/donor");
              break;
            case "receiver":
              navigate("/receiver");
              break;
            case "volunteer":
              navigate("/volunteer");
              break;
            default:
              navigate("/waiting-approval");
          }
        } else {
          // Admin can access dashboard directly
          navigate("/admin");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotStatus("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email: forgotEmail },
        { headers: { "Content-Type": "application/json" } }
      );
      setForgotStatus(
        res.data?.message ? `${res.data.message}. Check console for dev reset link.` : "Request submitted."
      );
      console.log("Dev reset link:", res.data?.resetLink);
    } catch (err) {
      setForgotStatus(err.response?.data?.message || "Could not process request. Try again later.");
    }
  };

  return (
    <div className="login-container">
      <h2>
        {requiredRole === "receiver"
          ? "Receiver Login"
          : requiredRole === "donor"
          ? "Donor Login"
          : requiredRole === "volunteer"
          ? "Volunteer Login"
          : requiredRole === "admin"
          ? "Admin Login"
          : "Login"}
      </h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength="6"
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          className="link-button"
          onClick={() => setShowForgot((v) => !v)}
          style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0 }}
        >
          {showForgot ? "Hide Forgot Password" : "Forgot password?"}
        </button>
      </div>

      {showForgot && (
        <div className="forgot-box" style={{ marginTop: 12 }}>
          <form onSubmit={handleForgot}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <button type="submit">Send Reset Link</button>
          </form>
          {forgotStatus && <div className="info-box" style={{ marginTop: 8 }}>{forgotStatus}</div>}
        </div>
      )}

      <p>
        Don't have an account?{" "}
        <Link to="/signup" className="signup-link">
          Sign up here
        </Link>
      </p>
    </div>
  );
}

export default Login;

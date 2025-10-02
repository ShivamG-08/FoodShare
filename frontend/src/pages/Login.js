import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        "http://localhost:5000/auth/login",
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
        if (response.data.user) {
          localStorage.setItem("userId", response.data.user.id);
          localStorage.setItem("userEmail", response.data.user.email);
          localStorage.setItem("userName", response.data.user.name || "");
        }

        if (response.data.role === "donor") {
          navigate("/donor-dashboard");
        } else {
          navigate("/receiver-dashboard");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>
        {requiredRole === "receiver"
          ? "Receiver Login"
          : requiredRole === "donor"
          ? "Donor Login"
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

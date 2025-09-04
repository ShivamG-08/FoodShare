import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/auth/signup", formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data?.message === "User registered successfully") {
        alert(`Signup successful! You are registered as a ${formData.role}.`);
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error signing up. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create an Account</h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
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

        <label>I want to:</label>
        <select name="role" value={formData.role} onChange={handleChange} required>
          <option value="donor">Donate Food</option>
          <option value="receiver">Receive Food</option>
        </select>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>

      <p>
        Already have an account?{" "}
        <a href="/login" className="login-link">
          Login here
        </a>
      </p>
    </div>
  );
}

export default Signup;

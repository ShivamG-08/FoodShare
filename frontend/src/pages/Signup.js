import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Input field styling
const inputStyle = {
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '16px',
  width: '100%',
  boxSizing: 'border-box'
};

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor"
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
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data && response.data.message === "User registered successfully") {
        alert(`Signup successful! You are registered as a ${formData.role}.`);
        navigate("/login");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error signing up. Please try again.";
      setError(errorMessage);
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '20px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      <h2>Create an Account</h2>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <input 
          name="name" 
          placeholder="Full Name" 
          value={formData.name}
          onChange={handleChange} 
          required 
          style={inputStyle}
        />
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          value={formData.email}
          onChange={handleChange} 
          required 
          style={inputStyle}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Password" 
          value={formData.password}
          onChange={handleChange} 
          required 
          style={inputStyle}
          minLength="6"
        />

        <div>
          <label>I want to: </label>
          <select 
            name="role" 
            value={formData.role}
            onChange={handleChange} 
            required
            style={{
              ...inputStyle,
              width: '100%',
              marginTop: '5px'
            }}
          >
            <option value="donor">Donate Food</option>
            <option value="receiver">Receive Food</option>
          </select>
        </div>

        <button 
          type="submit" 
          style={{
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '10px'
          }}
        >
          Sign Up
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <a href="/login" style={{ color: '#4CAF50' }}>Login here</a>
      </p>
    </div>
  );
}

export default Signup;

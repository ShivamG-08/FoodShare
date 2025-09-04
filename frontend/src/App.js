import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import DonorDashboard from "./pages/DonorDashboard";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import "./App.css";

function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to FoodShare</h1>
      <p>Connecting food donors with receivers to reduce food waste.</p>
    </div>
  );
}

function About() {
  return (
    <div className="about-container">
      <h2>About FoodShare</h2>
      <p>
        FoodShare helps restaurants, events, and individuals donate surplus food
        to those in need.
      </p>
    </div>
  );
}

function Contact() {
  return (
    <div className="contact-container">
      <h2>Contact Us</h2>
      <p>Email: support@foodshare.com</p>
      <p>Phone: +91-9876543210</p>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="landing-page">
      <Home />
      <About />
      <Contact />
    </div>
  );
}

function Navbar() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/donor-dashboard" || location.pathname === "/receiver-dashboard";

  if (hideNavbar) return null;

  return (
    <nav className="navbar">
      <h2 className="logo">FoodShare</h2>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/signup">Signup</Link></li>
      </ul>
    </nav>
  );
}

function App() {
  return (
    <Router>
      {/* Navbar */}
      <Navbar />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/receiver-dashboard" element={<ReceiverDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

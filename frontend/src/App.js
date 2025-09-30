import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import logo from "./images/logo.png";
import happyImage from "./images/happy.jpg";
import foodImage from "./images/FOOD.jpg";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import DonorDashboard from "./pages/DonorDashboard";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import "./App.css";

function Hero() {
  return (
    <header className="hero">
      <div className="hero-content">
        <h1>Donate Food,<br />Save Lives</h1>
        <p>Join us in the fight against hunger by donating surplus food to those in need.</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn primary">Donate Food</Link>
          <Link to="/signup" className="btn secondary">Receive Food</Link>
        </div>
      </div>
    </header>
  );
}

function Features() {
  return (
    <section className="features">
      <h2>How It Works</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🍽️</div>
          <h3>Register</h3>
          <p>Sign up as a donor or receiver in just a few simple steps.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>Post or Browse</h3>
          <p>Donors can post available food, receivers can browse listings.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🤝</div>
          <h3>Connect</h3>
          <p>Get matched and coordinate food pickup or delivery.</p>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="about" id="about">
      <div className="about-content">
        <div className="about-text">
          <h2>About FoodShare</h2>
          <p>FoodShare is a platform that connects food donors (restaurants, caterers, events) with verified non-profit organizations and individuals in need. Our mission is to reduce food waste while fighting hunger in our communities.</p>
          <Link to="/signup" className="btn primary">Join Us Now</Link>
        </div>
        <div className="about-image">
          <img src="/images/food-donation.jpg" alt="Food donation" />
        </div>
      </div>
    </section>
  );
}

function StoriesOfHope() {
  return (
    <section className="stories">
      <div className="container">
        <h2>Stories of Hope</h2>
        <div className="stories-grid">
          <div className="story-card">
            <div className="story-image">
              <img src={happyImage} alt="Happy family receiving food" />
            </div>
            <div className="story-content">
              <h3>Bringing Smiles to Families</h3>
              <p>Thanks to generous donors, we were able to provide nutritious meals to over 100 families in need last month. Your contributions make stories like these possible.</p>
              <a href="#read-more" className="read-more">Read Full Story →</a>
            </div>
          </div>
          <div className="story-card">
            <div className="story-content">
              <h3>Community Coming Together</h3>
              <p>Local restaurants and volunteers joined hands to distribute 500+ meals to the homeless community. Every meal served is a step toward ending hunger in our city.</p>
              <a href="#read-more" className="read-more">Read Full Story →</a>
            </div>
            <div className="story-image">
              <img src={foodImage} alt="Community food distribution" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="testimonials">
      <h2>What People Say</h2>
      <div className="testimonial-cards">
        <div className="testimonial">
          <p>"FoodShare helped us donate our excess event food to those who really needed it. Easy to use and great impact!"</p>
          <div className="testimonial-author">- Sarah, Event Organizer</div>
        </div>
        <div className="testimonial">
          <p>"As a small shelter, we rely on donations. FoodShare connects us with fresh, quality food we wouldn't have access to otherwise."</p>
          <div className="testimonial-author">- Michael, Shelter Director</div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2>Ready to Make a Difference?</h2>
        <p>Join our community of food donors and receivers today.</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn primary">Sign Up Now</Link>
          <Link to="/login" className="btn secondary">Login</Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>FoodShare</h3>
          <p>Connecting surplus food with those in need.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="#about">About</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/signup">Sign Up</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: contact@foodshare.com</p>
          <p>Phone: +1 (555) 123-4567</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} FoodShare. All rights reserved.</p>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="landing-page">
      <Hero />
      <Features />
      <About />
      <StoriesOfHope />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

function Navbar() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/donor-dashboard" || location.pathname === "/receiver-dashboard";

  if (hideNavbar) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo-img" />
          <h1 className="logo">FoodShare</h1>
        </div>
        <div className="nav-links">
          <a href="#home" className="nav-link">Home</a>
          <a href="#about" className="nav-link">About</a>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/signup" className="btn primary nav-button">Sign Up</Link>
        </div>
      </div>
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

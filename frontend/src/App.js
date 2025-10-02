import React, { useEffect } from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import "./style.css";
import Login from "./pages/Login";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

function Landing() {
  useEffect(() => {
    // Load DOM-manipulating script after mount to avoid null refs
    import("./script.js").catch(() => {});
  }, []);

  const navigate = useNavigate();
  const handleDonateNow = () => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (role === 'donor' && uid) {
      navigate('/donor-dashboard');
    } else {
      navigate('/login?role=donor');
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container nav-flex">
          <div className="logo">
            <img src="logo.png" alt="Logo" />
            <span className="logo-text">FoodShare</span>
          </div>
          <ul className="nav-links desktop-only">
            <li><a href="#about">About</a></li>
            <li><a href="#impact">Impact</a></li>
            <li><a href="#stories">Stories</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><Link to="/login" className="btn btn-secondary">Login</Link></li>
            <li><Link to="/admin-login" className="btn btn-secondary">Admin</Link></li>
            <li><button onClick={handleDonateNow} className="btn btn-secondary">Donar</button></li>
            <li><Link to="/login?role=receiver" className="btn btn-secondary">Receiver</Link></li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <header
        className="hero"
        style={{
          background: `url(${process.env.PUBLIC_URL}/background.png) center/cover no-repeat`,
        }}
      >
        <div className="overlay"></div>
        <div className="hero-content container">
          <h1>No One Should Go Hungry</h1>
          <p>Your donation helps feed families and fight food waste. Together, we can end hunger.</p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-secondary">Register</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        </div>
      </header>

      {/* About */}
      <section id="about" className="section bg-light bordered">
        <div className="container">
          <h2 className="section-title">About FoodShare</h2>
          <div className="about-card">
            <p>
              FoodShare is a platform dedicated to fighting hunger and reducing food waste.
              We connect individuals, restaurants, and organizations who have surplus food
              to NGOs and volunteers that distribute it to families in need.
            </p>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="section bordered">
        <div className="container">
          <h2 className="section-title">Our Impact</h2>
          <div className="impact-stats">
            <div className="impact-card">
              <h3 className="counter" data-target="100000">5000</h3>
              <p>Meals Served</p>
            </div>
            <div className="impact-card">
              <h3 className="counter" data-target="5000">500</h3>
              <p>Families Helped</p>
            </div>
            <div className="impact-card">
              <h3 className="counter" data-target="300">200</h3>
              <p>Volunteers</p>
            </div>
            <div className="impact-card">
              <h3 className="counter" data-target="150">100</h3>
              <p>NGO Partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stories */}
      <section id="stories" className="section stories bordered">
        <div className="container">
          <h2 className="section-title">Stories of Hope</h2>
          <div className="stories-flex">
            <div className="story-card">
              <img src="happy.jpg" alt="Family receiving food happily" />
              <h3>Rita's Family</h3>
              <p>With surplus food donations, Rita no longer worries about her children sleeping hungry.</p>
            </div>
            <div className="story-card">
              <img src="FOOD.jpg" alt="Volunteers distributing food" />
              <h3>Volunteers in Action</h3>
              <p>Hundreds of volunteers dedicate their time to ensure food reaches every needy hand.</p>
            </div>
            <div className="story-card">
              <img src="fodddd.jpg" alt="Child eating food" />
              <h3>A Child’s Smile</h3>
              <p>One donated meal turned into a smile of hope.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="section bordered">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features">
            <div className="feature">
              <i className="fas fa-user-plus feature-icon"></i>
              <h3>Sign Up</h3>
              <p>Join as a donor, NGO, or volunteer.</p>
            </div>
            <div className="feature">
              <i className="fas fa-utensils feature-icon"></i>
              <h3>Donate</h3>
              <p>Share surplus food easily through our platform.</p>
            </div>
            <div className="feature">
              <i className="fas fa-truck feature-icon"></i>
              <h3>Deliver</h3>
              <p>Volunteers & NGOs distribute food safely to families in need.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section bg-light bordered">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <form id="contact-form" className="contact-form">
            <input type="text" id="name" placeholder="Your Name" required />
            <input type="email" id="email" placeholder="Your Email" required />
            <textarea id="message" placeholder="Your Message" required></textarea>
            <button type="submit" className="btn btn-primary">Send Message</button>
          </form>
          <p id="form-msg"></p>
        </div>
      </section>

      {/* Donate */}
      <section id="donate" className="section donate-section">
        <div className="container donate-box">
          <h2 className="section-title">Support Our Mission</h2>
          <p>Every contribution helps us serve more meals and reach more families. Thank you for your generosity.</p>
          <Link to="/login?role=donor" className="btn btn-secondary">Make a Donation</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-flex">
          <div>
            <h3>FoodShare</h3>
            <p>Together, we fight hunger and reduce food waste.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#impact">Impact</a></li>
              <li><a href="#stories">Stories</a></li>
              <li><a href="#how">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4>Connect With Us</h4>
            <div className="socials">
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
            </div>
          </div>
        </div>
        <p className="footer-bottom">&copy; 2025 FoodShare. All rights reserved.</p>
      </footer>
    </>
  );
}

function App() {
  const RequireRole = ({ role, children }) => {
    const current = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    if (!current || current !== role) return <Navigate to="/login" replace />;
    return children;
  };
  const RequireAdmin = ({ children }) => {
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
    return isAdmin ? children : <Navigate to="/admin-login" replace />;
  };
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/receiver-dashboard"
        element={
          <RequireRole role="receiver">
            <ReceiverDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/donor-dashboard"
        element={
          <RequireRole role="donor">
            <DonorDashboard />
          </RequireRole>
        }
      />
    </Routes>
  );
}

export default App;

import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import DonorDashboard from "./pages/DonorDashboard";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import ResetPassword from "./pages/ResetPassword";
import StoryDetails from './pages/StoryDetails';
import "./App.css";

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <header
      className="hero"
      id="home"
      style={{}}
    >
      <div className="hero-bg" aria-hidden="true">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/assets/FoodShare Platform.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
      </div>
      <div className="hero-content hero-top">
        <h1>
          Donate Food,
          <br /> Save Lives
        </h1>
        <p>
          Join us in the fight against hunger by donating surplus food to those
          in need.
        </p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn primary">
            Donate/Receive Food
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- About ---------------- */
function About() {
  return (
    <section className="about" id="about">
      <div className="about-content">
        <div className="about-text">
          <h2>About FoodShare</h2>
          <p>
            FoodShare is a platform that connects food donors (restaurants,
            caterers, events) with verified non-profit organizations and
            individuals in need. Our mission is to reduce food waste while
            fighting hunger in our communities.
          </p>
          <Link to="/signup" className="btn primary">
            Join Us Now
          </Link>
        </div>
        <div className="about-image">
          <img src="/ab.jpg" alt="About FoodShare" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Features (How It Works) ---------------- */
function Features() {
  return (
    <section className="features" id="features">
      <h2>How It Works</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Register</h3>
          <p>Donor or Receiver can register for the platform in just a few steps.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>Post or Browse</h3>
          <p>Donor can post a picture of food with details; Receivers can browse available posts.</p>
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
              alignItems: 'stretch',
            }}
          >
            <Link
              to="/donor-dashboard"
              className="btn primary"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
              }}
              aria-label="Donor: Post Food"
              title="Donor: Post Food"
            >
              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>📤</span>
              <span style={{ marginTop: 6, fontWeight: 600 }}>Post Food</span>
            </Link>
            <Link
              to="/receiver-dashboard"
              className="btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                background: '#f2f4f7',
              }}
              aria-label="Receiver: Browse Posts"
              title="Receiver: Browse Posts"
            >
              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🔍</span>
              <span style={{ marginTop: 6, fontWeight: 600 }}>Browse Food</span>
            </Link>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🤝</div>
          <h3>Connect</h3>
          <p>Get matched and coordinate food pickup or delivery.</p>
          <button 
            className="btn secondary" 
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
            onClick={() => {
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Contact Us
          </button>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>Admin</h3>
          <p>Admin can manage users and food listings.</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/admin-login" className="btn secondary" style={{ padding: '0.5rem 1rem' }}>Admin Login</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Impact ---------------- */
function Impact() {
  return (
    <section className="features impact" id="impact">
      <h2>Our Impact</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🍽</div>
          <h3>10,000+</h3>
          <p>Meals Donated</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👨‍👩‍👧</div>
          <h3>500+</h3>
          <p>Families Helped</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🤝</div>
          <h3>200+</h3>
          <p>Volunteers</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>50+</h3>
          <p>Partners</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Stories ---------------- */
function StoriesOfHope() {
  return (
    <section className="stories" id="stories">
      <div className="container">
        <h2>Stories of Hope</h2>
        <div className="stories-grid">
          <div className="story-card">
            <div className="story-image">
              <img src="/Families.jpg" alt="Happy family receiving food" />
            </div>
            <div className="story-content">
              <h3>Bringing Smiles to Families</h3>
              <p>
                Thanks to generous donors, we were able to provide nutritious
                meals to over 100 families in need last month. Your contributions
                make stories like these possible.
              </p>
              <Link to="/stories/bringing-smiles-to-families" className="read-more">
                Read Full Story →
              </Link>
            </div>
          </div>
          <div className="story-card">
            <div className="story-content">
              <h3>Community Coming Together</h3>
              <p>
                Local restaurants and volunteers joined hands to distribute 500+
                meals to the homeless community. Every meal served is a step
                toward ending hunger in our city.
              </p>
              <Link to="/stories/community-coming-together" className="read-more">
                Read Full Story →
              </Link>
            </div>
            <div className="story-image">
              <img src="/community.jpg" alt="Community food distribution" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Support Our Mission ---------------- */
function SupportMission() {
  return (
    <section className="support" id="support">
      <div className="support-content" style={{ textAlign: "center" }}>
        <h2>Support Our Mission</h2>
        <p>
          Every meal counts. By supporting FoodShare, you help us continue reducing food waste and feeding those who need it most.
        </p>

        <div className="support-cards" style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
          {/* Become a Donor */}
          <div className="support-card" style={{ maxWidth: "350px", textAlign: "center" }}>
            <div className="support-icon" style={{ fontSize: "2rem", marginBottom: "1rem" }}>🍽</div>
            <h3>Become a Donor</h3>
            <p>
              Contribute surplus food from your home, restaurant, or event to help feed those in need. Reduce waste and make a tangible impact.
            </p>
            <Link
              to="/signup"
              state={{ role: "donor" }}
              className="btn primary"
            >
              Join as Donor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA Section ---------------- */
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

/* ---------------- Contact Us Form ---------------- */
function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value,
    };
    console.log("Form Data Submitted:", formData);
    alert("Thank you for contacting us! We will get back to you soon.");
    e.target.reset();
  };

  return (
    <section className="contact" id="contact">
      <div className="contact-content container">
        <h2>Contact Us</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <input type="text" name="name" placeholder="Your Name" required />
          <input type="email" name="email" placeholder="Your Email" required />
          <textarea name="message" placeholder="Your Message" rows="5" required></textarea>
          <button type="submit" className="btn primary">Send Message</button>
        </form>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
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
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#features">How It Works</a></li>
            <li><a href="#impact">Our Impact</a></li>
            <li><a href="#stories">Stories of Hope</a></li>
            <li><a href="#support">Support Mission</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} FoodShare. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ---------------- Navbar ---------------- */
function Navbar() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/admin-login" ||
    location.pathname === "/admin" ||
    location.pathname === "/donor-dashboard" ||
    location.pathname === "/receiver-dashboard";

  if (hideNavbar) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo-container">
          <img src="/food.jpg" alt="Logo" className="logo-img" />
          <h1 className="logo">FoodShare</h1>
        </div>
        <ul className="nav-links">
          <li><a href="#home" className="nav-link">Home</a></li>
          <li><a href="#about" className="nav-link">About</a></li>
          <li><a href="#features" className="nav-link">How It Works</a></li>
          <li><a href="#impact" className="nav-link">Our Impact</a></li>
          <li><a href="#stories" className="nav-link">Stories of Hope</a></li>
          <li><a href="#support" className="nav-link">Support Mission</a></li>
          <li><a href="#contact" className="nav-link">Contact Us</a></li>
          <li><Link to="/login" className="nav-link">Login</Link></li>
          <li><Link to="/signup" className="btn primary nav-button">Sign Up</Link></li>
        </ul>
      </div>
    </nav>
  );
}

function LandingPage() {
  return (
    <div className="landing-page">
      <Hero />
      <About />
      <Features />
      <Impact />
      <StoriesOfHope />
      <SupportMission />
      <Contact />      {/* Moved Contact section before CTA */}
      <CTA />          {/* CTA stays last */}
      <Footer />
    </div>
  );
}

/* ---------------- Main App ---------------- */
function App() {
  return (
    <>
      <Navbar />
      {/* Simple admin guard */}
      {/**/}
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            typeof window !== "undefined" && localStorage.getItem("isAdmin") === "true" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/receiver-dashboard" element={<ReceiverDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/stories/:storyId" element={<StoryDetails />} />
      </Routes>
    </>
  );
}

export default App;
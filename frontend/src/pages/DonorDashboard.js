import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaCog,
  FaHistory,
  FaBoxOpen,
  FaGift,
  FaUsers,
  FaBars,
  FaBell,
  FaSignOutAlt,
  FaMapMarkedAlt,
} from "react-icons/fa";
import "./DonorDashboard.css";
import { predictFreshness } from "../services/predictionApi";
import MapSection from "../components/MapSection";
import { createDonation, getDonationsByUser } from "../services/donationApi";
import { getNotifications, markNotificationRead } from "../services/notificationApi";

const DonorDashboard = () => {
  const [activeTab, setActiveTab] = useState("currentDonations");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  // Determine donor login state
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const uid = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isDonor = role === "donor" && !!uid;

  // Donation form state
  const [food, setFood] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifError, setNotifError] = useState("");
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Donation history state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [donations, setDonations] = useState([]);

  // Non-UI helper to call AI model; safe to use anywhere in dashboard logic
  // Usage example (do not change UI):
  // const result = await predictFreshnessForFood(foodData);
  const predictFreshnessForFood = async (foodData) => {
    try {
      const prediction = await predictFreshness(foodData);
      console.log("AI prediction:", prediction);
      return prediction;
    } catch (err) {
      console.error("Prediction error:", err);
      return null;
    }
  };

  const toggleNotifications = async () => {
    try {
      setNotifError("");
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      if (!userId) return;
      // Always refresh on open
      if (!showNotifications) {
        const list = await getNotifications(userId);
        setNotifications(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error("Load notifications error", e);
      setNotifError("Failed to load notifications");
    } finally {
      setShowNotifications(!showNotifications);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error("Mark read error", e);
    }
  };

  // Prefetch notifications when dashboard mounts (only for donors)
  useEffect(() => {
    const prefetch = async () => {
      try {
        setNotifError("");
        if (!isDonor) return;
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        if (!userId) return;
        const list = await getNotifications(userId);
        setNotifications(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Prefetch notifications error", e);
        setNotifError("Failed to load notifications");
      }
    };
    prefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire one dummy prediction on mount without affecting UI
  useEffect(() => {
    const dummy = {
      food_type: "fruit",
      food_name: "Apple",
      cuisine: "universal",
      time_since_cooked_hours: 2,
      storage_temp_c: 4,
      humidity: 0.5,
      packaging: "none",
      previous_reheats: 0,
      ph_level: 7.0,
      smell_score: 6,
    };
    predictFreshnessForFood(dummy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load donation history when history tab is opened
  useEffect(() => {
    const loadHistory = async () => {
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      if (!userId) return;
      setHistoryError("");
      setHistoryLoading(true);
      try {
        const data = await getDonationsByUser(userId);
        setDonations(Array.isArray(data) ? data : []);
      } catch (e) {
        setHistoryError("Failed to load donation history.");
        console.error(e);
      } finally {
        setHistoryLoading(false);
      }
    };
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab]);

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) {
      setSubmitError("You must be logged in to donate.");
      return;
    }
    if (!food || !quantity || !location) {
      setSubmitError("Please fill all required fields.");
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = { userId, food, quantity, location, notes };
      await createDonation(payload);
      setSubmitSuccess("Donation submitted.");
      setFood("");
      setQuantity("");
      setLocation("");
      setNotes("");
    } catch (e) {
      setSubmitError("Failed to submit donation.");
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="dashboard-content">
            <h2>Profile</h2>
            <div className="card-grid">
              <div className="card">
                <h3>Name</h3>
                <p>Rajanikant jaiswar</p>
              </div>
              <div className="card">
                <h3>Email</h3>
                <p>john.doe@email.com</p>
              </div>
              <div className="card">
                <h3>Total Donations</h3>
                <p>15</p>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="dashboard-content">
            <h2>Settings</h2>
            <div className="card">
              <p>Manage your account preferences and update your details here.</p>
            </div>
          </div>
        );
      case "history":
        return (
          <div className="dashboard-content">
            <h2>Donation History</h2>
            {historyLoading && <p>Loading...</p>}
            {historyError && <div className="card error"><p>{historyError}</p></div>}
            {!historyLoading && donations.length === 0 && !historyError && (
              <div className="card"><p>No donations yet.</p></div>
            )}
            <div className="card-grid">
              {donations.map((d) => (
                <div key={d._id} className="card">
                  <h4>🍽️ {d.food}</h4>
                  <p>Qty: {d.quantity}</p>
                  <p>Location: {d.location}</p>
                  <p>Status: {d.status}</p>
                  <p>
                    Date: {new Date(d.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      case "currentDonations":
        return (
          <div className="dashboard-content">
            <h2>New Donation</h2>
            <div className="card">
              {submitError && <div className="error">{submitError}</div>}
              {submitSuccess && <div className="success">{submitSuccess}</div>}
              <form onSubmit={handleSubmitDonation} className="form-grid">
                <div className="form-row">
                  <label>Food *</label>
                  <input value={food} onChange={(e) => setFood(e.target.value)} placeholder="e.g., Rice & Curry" />
                </div>
                <div className="form-row">
                  <label>Quantity *</label>
                  <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g., 3 plates / 2 kg" />
                </div>
                <div className="form-row">
                  <label>Location *</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Andheri West, Mumbai" />
                </div>
                <div className="form-row">
                  <label>Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes (packaging, pickup window, etc.)" />
                </div>
                <button type="submit" disabled={submitLoading} className="btn btn-primary">
                  {submitLoading ? "Submitting..." : "Submit Donation"}
                </button>
              </form>
            </div>
          </div>
        );
      case "rewards":
        return (
          <div className="dashboard-content">
            <h2>Rewards</h2>
            <div className="card-grid">
              <div className="card reward">
                <h3>🎉 FoodPoints</h3>
                <p>120</p>
              </div>
              <div className="card reward">
                <h3>🏆 Badges</h3>
                <p>Gold Donor</p>
              </div>
            </div>
          </div>
        );
      case "connections":
        return (
          <div className="dashboard-content">
            <h2>Connections</h2>
            <div className="card-grid">
              <div className="card">
                <h4>Rajanikant jaiswar</h4>
                <p>Receiver</p>
              </div>
              <div className="card">
                <h4>Helping Hands NGO</h4>
                <p>Organization</p>
              </div>
            </div>
          </div>
        );
      case "map":
        return (
          <div className="dashboard-content">
            <h2>Nearby Activity</h2>
            <MapSection
              title="Donor Map"
              role="donor"
              initialRadiusKm={8}
              markers={[
                {
                  id: 1,
                  position: { lat: 19.076, lng: 72.8777 },
                  label: "You (donor base)",
                  color: "#f59e0b",
                },
                {
                  id: 2,
                  position: { lat: 19.09, lng: 72.88 },
                  label: "Receiver: Helping Hands",
                  color: "#10b981",
                },
                {
                  id: 3,
                  position: { lat: 19.06, lng: 72.86 },
                  label: "Receiver: Community Center",
                  color: "#10b981",
                },
              ]}
            />
          </div>
        );
      default:
        return <div className="dashboard-content"><h2>Welcome to Donor Dashboard</h2></div>;
    }
  };

  const handleLogout = () => {
    try {
      // Clear any auth state
      localStorage.removeItem("userRole");
      localStorage.removeItem("token");
      // Navigate to login
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("Logout error", e);
      navigate("/login", { replace: true });
    }
  };

  // If not logged in as donor, show prompt with Login button
  if (!isDonor) {
    return (
      <div className="dashboard">
        <div className="main-section">
          <header className="topbar">
            <div className="welcome-text">
              <h3>Donor Login Required</h3>
            </div>
          </header>
          <div className="content-area">
            <div className="dashboard-content">
              <h2>Please log in as Donor</h2>
              <p>You must be logged in as a donor to access this page and submit donations.</p>
              <a className="btn btn-primary" href="/login?role=donor">Login as Donor</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="top-section">
          {!isCollapsed && <h1 className="logo">FoodShare</h1>}
          <button
            className="toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <FaBars />
          </button>
        </div>
        <ul>
          <li
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            <FaUser /> {!isCollapsed && "Profile"}
          </li>
          <li
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            <FaCog /> {!isCollapsed && "Settings"}
          </li>
          <li
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            <FaHistory /> {!isCollapsed && "History"}
          </li>
          <li
            className={activeTab === "currentDonations" ? "active" : ""}
            onClick={() => setActiveTab("currentDonations")}
          >
            <FaBoxOpen /> {!isCollapsed && "Current Donations"}
          </li>
          <li
            className={activeTab === "rewards" ? "active" : ""}
            onClick={() => setActiveTab("rewards")}
          >
            <FaGift /> {!isCollapsed && "Rewards"}
          </li>
          <li
            className={activeTab === "connections" ? "active" : ""}
            onClick={() => setActiveTab("connections")}
          >
            <FaUsers /> {!isCollapsed && "Connections"}
          </li>
          <li
            className={activeTab === "map" ? "active" : ""}
            onClick={() => setActiveTab("map")}
          >
            <FaMapMarkedAlt /> {!isCollapsed && "Map"}
          </li>
        </ul>
      </aside>

      {/* Main Section */}
      <div className="main-section">
        {/* Top Navbar */}
        <header className="topbar">
          <div className="welcome-text">
            <h3>Welcome, Donor 👋</h3>
          </div>
          <div className="topbar-actions">
            <div className="notification-icon" style={{ position: "relative" }}>
              <button className="icon-btn" onClick={toggleNotifications}>
                <FaBell />
                {unreadCount > 0 && (
                  <span className="badge" style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: 10, padding: "0 6px", fontSize: 12 }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="notification-dropdown" style={{ position: "absolute", right: 0, marginTop: 8, width: 320, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 10px 15px rgba(0,0,0,0.1)", zIndex: 10 }}>
                  <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
                    <strong>Notifications</strong>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {notifError && (
                      <div style={{ padding: 12, color: "#b91c1c", background: "#fef2f2" }}>{notifError}</div>
                    )}
                    {notifications.length === 0 && (
                      <div style={{ padding: 12, color: "#6b7280" }}>No notifications</div>
                    )}
                    {notifications.map((n) => (
                      <div key={n._id} style={{ padding: 12, display: "flex", gap: 8, alignItems: "flex-start", background: n.read ? "#fff" : "#f9fafb" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{n.title}</div>
                          <div style={{ color: "#374151", fontSize: 14 }}>{n.message}</div>
                          {n.meta?.receiver && (
                            <div style={{ color: "#374151", fontSize: 13, marginTop: 4 }}>
                              <strong>Receiver:</strong> {n.meta.receiver.name || 'N/A'}
                              {n.meta.receiver.email ? ` (${n.meta.receiver.email})` : ''}
                            </div>
                          )}
                          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                        {!n.read && (
                          <button className="btn" onClick={() => handleMarkRead(n._id)} style={{ fontSize: 12 }}>Mark read</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="user-info">
              <FaUser className="avatar" />
              <span className="username">Rajanikant jaiswar</span>
              <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic content */}
        <div className="content-area">{renderContent()}</div>
      </div>
    </div>
  );
};

export default DonorDashboard;


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

const DonorDashboard = () => {
  const [activeTab, setActiveTab] = useState("currentDonations");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

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

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div>
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
          <div>
            <h2>Settings</h2>
            <div className="card">
              <p>Manage your account preferences and update your details here.</p>
            </div>
          </div>
        );
      case "history":
        return (
          <div>
            <h2>Donation History</h2>
            <div className="card-grid">
              <div className="card">
                <h4>🍞 Bread</h4>
                <p>Donated on 15 Sept</p>
              </div>
              <div className="card">
                <h4>🥗 Salad</h4>
                <p>Donated on 20 Sept</p>
              </div>
              <div className="card">
                <h4>🍎 Fruits</h4>
                <p>Donated on 25 Sept</p>
              </div>
            </div>
          </div>
        );
      case "currentDonations":
        return (
          <div>
            <h2>Current Donations</h2>
            <div className="card-grid">
              <div className="card">
                <h4>🍛 Rice & Curry</h4>
                <p>Status: Pending pickup</p>
              </div>
              <div className="card">
                <h4>🥤 Juice Pack</h4>
                <p>Status: Assigned to receiver</p>
              </div>
            </div>
          </div>
        );
      case "rewards":
        return (
          <div>
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
          <div>
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
          <div>
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
        return <h2>Welcome to Donor Dashboard</h2>;
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
            <button className="icon-btn">
              <FaBell />
            </button>
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
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default DonorDashboard;


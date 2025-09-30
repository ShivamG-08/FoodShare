import React, { useState } from "react";
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
} from "react-icons/fa";
import "./DonorDashboard.css";

const DonorDashboard = () => {
  const [activeTab, setActiveTab] = useState("currentDonations");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div>
            <h2>Profile</h2>
            <div className="card-grid">
              <div className="card">
                <h3>Name</h3>
                <p>John Doe</p>
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
                <h4>John Doe</h4>
                <p>Receiver</p>
              </div>
              <div className="card">
                <h4>Helping Hands NGO</h4>
                <p>Organization</p>
              </div>
            </div>
          </div>
        );
      default:
        return <h2>Welcome to Donor Dashboard</h2>;
    }
  };

  const handleLogout = () => {
    alert("You have been logged out!"); // later replace with real logout logic
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
              <span className="username">JohnDoe</span>
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

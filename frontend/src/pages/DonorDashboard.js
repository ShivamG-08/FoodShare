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
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
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
  const userName = (typeof window !== "undefined" && localStorage.getItem("userName")) || (typeof window !== "undefined" && localStorage.getItem("userEmail")) || "Donor";
  const userEmail = (typeof window !== "undefined" && localStorage.getItem("userEmail")) || "";

  // Donation form state
  const [food, setFood] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [foodType, setFoodType] = useState("cooked");
  const [cookedHours, setCookedHours] = useState("");
  const [storageTemp, setStorageTemp] = useState("");
  const [reheated, setReheated] = useState(false);
  const [safetyCheck, setSafetyCheck] = useState(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [safetyError, setSafetyError] = useState("");
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      // In a real app, you would upload the file to your server here
      // For now, we'll just create a local URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result;
        setProfileImage(imageUrl);
        localStorage.setItem('profileImage', imageUrl); // Save to localStorage for persistence
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest(".notifications-dropdown")) {
        setShowNotifications(false);
      }
      if (showProfileDropdown && !event.target.closest(".profile-dropdown")) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showNotifications, showProfileDropdown]);

  useEffect(() => {
    const prefetch = async () => {
      try {
        if (isDonor) {
          const data = await getDonationsByUser(uid);
          setDonations(Array.isArray(data) ? data : []);

          const notifications = await getNotifications(uid);
          setNotifications(Array.isArray(notifications) ? notifications : []);
        }
      } catch (error) {
        console.error("Error prefetching data:", error);
      }
    };
    
    prefetch();
  }, [uid, isDonor]);

  useEffect(() => {
    const warmupPrediction = async () => {
      try {
        if (isDonor) {
          // This is just to warm up the model, we don't need the result
          await predictFreshnessForFood({
            foodType: "cooked",
            foodName: "Pizza",
            cookedHours: 2,
            temperatureStore: 4,
            reheated: false
          });
        }
      } catch (error) {
        console.warn("Model warmup failed:", error);
      }
    };
    
    warmupPrediction();
  }, [isDonor]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!isDonor || activeTab !== "history") return;
      
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
    
    loadHistory();
  }, [activeTab, isDonor]);

  const checkFoodSafety = async () => {
    if (!food || !cookedHours || !storageTemp) {
      setSafetyError('Please fill in all required fields');
      return;
    }

    setCheckingSafety(true);
    setSafetyError('');
    setSafetyCheck(null);

    try {
      const response = await fetch('http://localhost:5000/api/prediction/check-safety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          foodType,
          foodName: food,
          cookedHours: parseFloat(cookedHours),
          temperatureStore: parseFloat(storageTemp),
          reheated
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check food safety');
      }

      const result = await response.json();
      
      setSafetyCheck({
        status: result.status,
        confidence: result.confidence,
        message: result.message || `Food safety check: ${result.status}`
      });
      
      setShowSafetyModal(true);
    } catch (error) {
      console.error("Error checking food safety:", error);
      setSafetyError(error.message || "Failed to check food safety. Please try again.");
    } finally {
      setCheckingSafety(false);
    }
  };

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    
    if (!safetyCheck || safetyCheck.status === 'not_ok') {
      setSubmitError("Please check food safety and ensure it's safe to donate.");
      return;
    }
    
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
      const payload = { 
        userId, 
        food, 
        quantity, 
        location, 
        notes,
        foodType,
        cookedHours: parseFloat(cookedHours),
        storageTemp: parseFloat(storageTemp),
        reheated,
        safetyStatus: safetyCheck.status
      };
      
      await createDonation(payload);
      setSubmitSuccess("Donation submitted successfully!");
      
      // Reset form
      setFood("");
      setQuantity("");
      setLocation("");
      setNotes("");
      setCookedHours("");
      setStorageTemp("");
      setReheated(false);
      setSafetyCheck(null);
    } catch (e) {
      console.error("Donation submission error:", e);
      setSubmitError("Failed to submit donation. Please try again.");
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
            <div className="profile-section" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  backgroundColor: '#e5e7eb', 
                  overflow: 'hidden',
                  position: 'relative',
                  border: '3px solid #fff',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '3rem',
                      color: '#9ca3af'
                    }}>
                      <FaUser />
                    </div>
                  )}
                  <label 
                    htmlFor="profile-upload" 
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                    title="Change profile picture"
                  >
                    <FaCog size={16} />
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      style={{ display: 'none' }}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                <h3 style={{ margin: '0', color: '#1f2937' }}>{userName}</h3>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>{userEmail}</p>
              </div>
              
              <div style={{ flex: 1 }}>
                <div className="card-grid">
                  <div className="card">
                    <h3>Name</h3>
                    <p>{userName}</p>
                  </div>
                  <div className="card">
                    <h3>Email</h3>
                    <p>{userEmail || 'N/A'}</p>
                  </div>
                  <div className="card">
                    <h3>Total Donations</h3>
                    <p>15</p>
                  </div>
                </div>
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
                  <label>Food Name *</label>
                  <input 
                    value={food} 
                    onChange={(e) => setFood(e.target.value)} 
                    placeholder="e.g., Pasta, Rice, etc." 
                  />
                </div>
                
                <div className="form-row">
                  <label>Food Type *</label>
                  <select 
                    value={foodType} 
                    onChange={(e) => setFoodType(e.target.value)}
                    className="form-select"
                  >
                    <option value="cooked">Cooked Food</option>
                    <option value="raw">Raw Ingredients</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <label>
                    {foodType === 'cooked' 
                      ? 'Hours since cooked *' 
                      : 'Hours since prepared *'}
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.5"
                    value={cookedHours}
                    onChange={(e) => setCookedHours(e.target.value)}
                    placeholder="e.g., 2.5"
                  />
                </div>
                
                <div className="form-row">
                  <label>Storage Temperature (°C) *</label>
                  <input 
                    type="number"
                    value={storageTemp}
                    onChange={(e) => setStorageTemp(e.target.value)}
                    placeholder="e.g., 4 (refrigerated)"
                  />
                </div>
                
                <div className="form-row checkbox-row">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={reheated}
                      onChange={(e) => setReheated(e.target.checked)}
                    />
                    <span>This food has been reheated</span>
                  </label>
                </div>
                
                <div className="form-row">
                  <label>Quantity *</label>
                  <input 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    placeholder="e.g., 3 plates / 2 kg" 
                  />
                </div>
                
                <div className="form-row">
                  <label>Pickup Location *</label>
                  <input 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="e.g., Andheri West, Mumbai" 
                  />
                </div>
                
                <div className="form-row">
                  <label>Additional Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Special instructions, ingredients, etc." 
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={checkFoodSafety}
                    disabled={!food || !cookedHours || !storageTemp || checkingSafety}
                    className="btn btn-secondary"
                  >
                    {checkingSafety ? 'Checking...' : 'Check Food Safety'}
                  </button>
                  
                  <button 
                    type="submit" 
                    disabled={submitLoading || !safetyCheck || safetyCheck.status === 'not_ok'}
                    className="btn btn-primary"
                  >
                    {submitLoading ? 'Submitting...' : 'Submit Donation'}
                  </button>
                </div>
                
                {safetyError && <div className="error">{safetyError}</div>}
                
                {safetyCheck && (
                  <div className={`safety-status ${safetyCheck.status}`}>
                    {safetyCheck.status === 'ok' && (
                      <p className="text-success">
                        <FaCheckCircle /> This food is safe to donate!
                      </p>
                    )}
                    {safetyCheck.status === 'borderline' && (
                      <p className="text-warning">
                        <FaExclamationTriangle /> This food is borderline. Please check carefully.
                      </p>
                    )}
                    {safetyCheck.status === 'not_ok' && (
                      <p className="text-danger">
                        <FaInfoCircle /> This food is not safe to donate.
                      </p>
                    )}
                  </div>
                )}
              </form>
              
              {/* Safety Check Modal */}
              {showSafetyModal && safetyCheck && (
                <div className="modal-overlay">
                  <div className="modal">
                    <div className="modal-header">
                      <h3>Food Safety Check Results</h3>
                      <button 
                        className="close-btn"
                        onClick={() => setShowSafetyModal(false)}
                      >
                        &times;
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className={`safety-result ${safetyCheck.status}`}>
                        {safetyCheck.status === 'ok' && (
                          <>
                            <FaCheckCircle className="result-icon" />
                            <h4>Safe to Donate</h4>
                            <p>This food meets all safety requirements for donation.</p>
                          </>
                        )}
                        {safetyCheck.status === 'borderline' && (
                          <>
                            <FaExclamationTriangle className="result-icon" />
                            <h4>Use Caution</h4>
                            <p>This food is at the edge of safety limits. Please consider the following:</p>
                            <ul>
                              <li>Check for any unusual odors or discoloration</li>
                              <li>Ensure proper storage temperature was maintained</li>
                              <li>Consider discarding if unsure about safety</li>
                            </ul>
                          </>
                        )}
                        {safetyCheck.status === 'not_ok' && (
                          <>
                            <FaInfoCircle className="result-icon" />
                            <h4>Not Safe to Donate</h4>
                            <p>This food does not meet safety standards for donation due to:</p>
                            <ul>
                              <li>Potential bacterial growth risk</li>
                              <li>Improper storage conditions</li>
                              <li>Exceeded safe time limits</li>
                            </ul>
                          </>
                        )}
                        
                        <div className="confidence-levels">
                          <h5>Confidence Levels:</h5>
                          <div className="progress-container">
                            <div className="progress-label">Safe</div>
                            <div className="progress">
                              <div 
                                className="progress-bar bg-success" 
                                style={{ width: `${safetyCheck.confidence.ok * 100}%` }}
                              >
                                {Math.round(safetyCheck.confidence.ok * 100)}%
                              </div>
                            </div>
                          </div>
                          <div className="progress-container">
                            <div className="progress-label">Borderline</div>
                            <div className="progress">
                              <div 
                                className="progress-bar bg-warning" 
                                style={{ width: `${safetyCheck.confidence.borderline * 100}%` }}
                              >
                                {Math.round(safetyCheck.confidence.borderline * 100)}%
                              </div>
                            </div>
                          </div>
                          <div className="progress-container">
                            <div className="progress-label">Not Safe</div>
                            <div className="progress">
                              <div 
                                className="progress-bar bg-danger" 
                                style={{ width: `${safetyCheck.confidence.not_ok * 100}%` }}
                              >
                                {Math.round(safetyCheck.confidence.not_ok * 100)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button 
                        className="btn btn-primary"
                        onClick={() => setShowSafetyModal(false)}
                      >
                        {safetyCheck.status === 'not_ok' ? 'I Understand' : 'Continue'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
            <h3>Welcome, {userName} 👋</h3>
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
            <div className="user-info" style={{ position: 'relative' }}>
              <div 
                className="user-avatar" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  padding: '8px 12px', 
                  borderRadius: '4px' 
                }}
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      objectFit: 'cover' 
                    }} 
                  />
                ) : (
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e5e7eb', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <FaUser style={{ color: '#4b5563' }} />
                  </div>
                )}
                <span className="username" style={{ fontWeight: 500 }}>{userName}</span>
              </div>

              {showProfileDropdown && (
                <div 
                  className="profile-dropdown"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '200px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 10,
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    className="profile-dropdown-item" 
                    onClick={() => {
                      setActiveTab('profile');
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      color: '#1f2937',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                  >
                    <FaUser size={16} style={{ color: '#6b7280' }} />
                    <span>Profile</span>
                  </div>
                  <div 
                    className="profile-dropdown-item"
                    onClick={() => {
                      setActiveTab('settings');
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      color: '#1f2937',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                  >
                    <FaCog size={16} style={{ color: '#6b7280' }} />
                    <span>Settings</span>
                  </div>
                  <div 
                    className="profile-dropdown-item"
                    onClick={handleLogout}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      color: '#dc2626'
                    }}
                  >
                    <FaSignOutAlt size={16} />
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                marginLeft: '12px',
                color: '#dc2626',
                fontWeight: 500
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              <FaSignOutAlt size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic content */}
        <div className="content-area">{renderContent()}</div>
      </div>
    </div>
  );
};

export default DonorDashboard;


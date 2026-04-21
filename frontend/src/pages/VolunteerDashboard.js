import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaCog,
  FaHistory,
  FaBoxOpen,
  FaTruck,
  FaUsers,
  FaBars,
  FaBell,
  FaSignOutAlt,
  FaMapMarkedAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaRoute,
  FaCamera,
} from "react-icons/fa";
import "./VolunteerDashboard.css";
import { getUser, uploadAvatar, uploadProfilePicture } from "../services/usersApi";
import { getAvailableTasks, acceptTask, updateTaskStatus, getVolunteerTasks } from "../services/taskApi";
import VolunteerMap from "../components/VolunteerMap";
import { getCurrentLocation } from "../utils/geolocation";
import "../components/VolunteerMap.css";

const VolunteerDashboard = () => {
  const [activeTab, setActiveTab] = useState("availableDonations");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  
  // Determine volunteer login state
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const uid = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isVolunteer = role === "volunteer" && !!uid;
  const userName = (typeof window !== "undefined" && localStorage.getItem("userName")) || 
                   (typeof window !== "undefined" && localStorage.getItem("userEmail")) || "Volunteer";
  const userEmail = (typeof window !== "undefined" && localStorage.getItem("userEmail")) || "";

  // Profile picture state
  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window === 'undefined') return '';
    const role = localStorage.getItem('userRole') || 'volunteer';
    const uid = localStorage.getItem('userId') || '';
    const key = uid ? `profileImage:${role}:${uid}` : 'profileImage:guest';
    return localStorage.getItem(key) || '';
  });
  const [isUploading, setIsUploading] = useState(false);

  // State for donations
  const [availableDonations, setAvailableDonations] = useState([]);
  const [assignedDonations, setAssignedDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // State for tasks
  const [availableTasks, setAvailableTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState("");
  
  // State for map functionality
  const [users, setUsers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Profile picture upload handler
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadProfilePicture(file);
      const url = res?.profileImageUrl || '';
      if (url) {
        setProfileImage(url);
        const role = localStorage.getItem('userRole') || 'volunteer';
        const uid = localStorage.getItem('userId') || '';
        const key = uid ? `profileImage:${role}:${uid}` : 'profileImage:guest';
        try { localStorage.setItem(key, url); } catch (_) {}
        alert('Profile picture uploaded successfully!');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch users with location data
  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Handle location update from map
  const handleLocationUpdate = (location) => {
    setUserLocation(location);
  };

  // Fetch available donations
  const fetchAvailableDonations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/donations/available`);
      if (!response.ok) throw new Error("Failed to fetch available donations");
      const data = await response.json();
      setAvailableDonations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assigned donations for this volunteer
  const fetchAssignedDonations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/donations/volunteer/${uid}`);
      if (!response.ok) throw new Error("Failed to fetch assigned donations");
      const data = await response.json();
      setAssignedDonations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept a donation task
  const acceptDonation = async (donationId) => {
    try {
      setLoading(true);
      
      // Validate volunteer ID
      if (!uid) {
        console.error("No volunteer ID found");
        setError("You must be logged in as a volunteer to accept donations");
        return;
      }
      
      console.log("Accepting donation:", donationId);
      console.log("Volunteer ID:", uid);
      console.log("User role:", role);
      
      const response = await fetch(`http://localhost:5000/api/donations/${donationId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ volunteerId: uid }),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Failed to accept donation");
      }
      
      const result = await response.json();
      console.log("Accept donation result:", result);
      
      // Show success message
      setError("");
      alert("Donation accepted successfully! Check your assigned tasks.");
      
      // Refresh both lists
      await Promise.all([fetchAvailableDonations(), fetchAssignedDonations()]);
    } catch (err) {
      console.error("Accept donation error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update delivery status
  const updateDeliveryStatus = async (donationId, status) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/donations/${donationId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ volunteerId: uid, status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }
      
      // Refresh assigned donations
      await fetchAssignedDonations();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available tasks
  const fetchAvailableTasks = async () => {
    try {
      setTaskLoading(true);
      const tasks = await getAvailableTasks();
      setAvailableTasks(tasks);
      setTaskError("");
    } catch (err) {
      setTaskError("Failed to fetch available tasks");
      console.error("Fetch tasks error:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  // Fetch volunteer's assigned tasks
  const fetchAssignedTasks = async () => {
    try {
      setTaskLoading(true);
      const tasks = await getVolunteerTasks(uid);
      setAssignedTasks(tasks);
      setTaskError("");
    } catch (err) {
      setTaskError("Failed to fetch assigned tasks");
      console.error("Fetch assigned tasks error:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  // Accept a task
  const acceptTaskHandler = async (taskId) => {
    try {
      setTaskLoading(true);
      await acceptTask(taskId, uid);
      
      // Refresh both task lists
      await Promise.all([fetchAvailableTasks(), fetchAssignedTasks()]);
      
      alert("Task accepted successfully! Check your assigned tasks.");
    } catch (err) {
      setTaskError(err.response?.data?.message || "Failed to accept task");
      console.error("Accept task error:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  // Update task status
  const updateTaskStatusHandler = async (taskId, status, notes) => {
    try {
      setTaskLoading(true);
      await updateTaskStatus(taskId, status, uid, notes);
      
      // Refresh assigned tasks
      await fetchAssignedTasks();
      
      alert(`Task status updated to: ${status}`);
    } catch (err) {
      setTaskError(err.response?.data?.message || "Failed to update task status");
      console.error("Update task status error:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  // Load data on component mount and tab change
  useEffect(() => {
    if (!isVolunteer) {
      navigate("/login");
      return;
    }

    // Fetch users data for map
    fetchUsers();

    if (activeTab === "availableDonations") {
      fetchAvailableDonations();
    } else if (activeTab === "assignedTasks") {
      fetchAssignedDonations();
    } else if (activeTab === "availableTasks") {
      fetchAvailableTasks();
    } else if (activeTab === "myTasks") {
      fetchAssignedTasks();
    }
  }, [isVolunteer, navigate, activeTab]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="status-badge pending">Pending</span>;
      case "assigned":
        return <span className="status-badge assigned">Assigned</span>;
      case "picked_up":
        return <span className="status-badge picked-up">Picked Up</span>;
      case "completed":
        return <span className="status-badge completed">Delivered</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (!isVolunteer) {
    return <div className="access-denied">Access denied. Volunteers only.</div>;
  }

  return (
    <div className={`volunteer-dashboard ${isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <FaTruck className="logo-icon" />
            {!isCollapsed && <span>Volunteer</span>}
          </div>
          <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            <FaBars />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <button
                className={`nav-btn ${activeTab === "availableDonations" ? "active" : ""}`}
                onClick={() => setActiveTab("availableDonations")}
              >
                <FaBoxOpen />
                {!isCollapsed && <span>Available Donations</span>}
              </button>
            </li>
            <li>
              <button
                className={`nav-btn ${activeTab === "availableTasks" ? "active" : ""}`}
                onClick={() => setActiveTab("availableTasks")}
              >
                <FaBoxOpen />
                {!isCollapsed && <span>Available Tasks</span>}
              </button>
            </li>
            <li>
              <button
                className={`nav-btn ${activeTab === "myTasks" ? "active" : ""}`}
                onClick={() => setActiveTab("myTasks")}
              >
                <FaRoute />
                {!isCollapsed && <span>My Tasks</span>}
              </button>
            </li>
            <li>
              <button
                className={`nav-btn ${activeTab === "map" ? "active" : ""}`}
                onClick={() => setActiveTab("map")}
              >
                <FaMapMarkedAlt />
                {!isCollapsed && <span>Map View</span>}
              </button>
            </li>
            <li>
              <button
                className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <FaUser />
                {!isCollapsed && <span>Profile</span>}
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <FaUser className="user-icon" />
            {!isCollapsed && (
              <div className="user-details">
                <div className="user-name">{userName}</div>
                <div className="user-email">{userEmail}</div>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <h1>Volunteer Dashboard</h1>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{availableDonations.length}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{assignedDonations.length}</div>
              <div className="stat-label">Assigned</div>
            </div>
          </div>
        </header>

        {error && (
          <div className="error-message">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        <div className="content-area">
          {activeTab === "availableDonations" && (
            <div className="donations-section">
              <h2>Available Donations</h2>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : availableDonations.length === 0 ? (
                <div className="empty-state">
                  <FaBoxOpen className="empty-icon" />
                  <p>No available donations at the moment.</p>
                </div>
              ) : (
                <div className="donations-grid">
                  {availableDonations.map((donation) => (
                    <div key={donation._id} className="donation-card">
                      <div className="card-header">
                        <h3>{donation.food}</h3>
                        {getStatusBadge(donation.status)}
                      </div>
                      <div className="card-body">
                        <div className="detail-item">
                          <FaBoxOpen className="detail-icon" />
                          <span>Quantity: {donation.quantity}</span>
                        </div>
                        <div className="detail-item">
                          <FaMapMarkedAlt className="detail-icon" />
                          <span>Location: {donation.location}</span>
                        </div>
                        <div className="detail-item">
                          <FaUser className="detail-icon" />
                          <span>Donor: {donation.donor?.name || "Anonymous"}</span>
                        </div>
                        <div className="detail-item">
                          <FaClock className="detail-icon" />
                          <span>Posted: {formatDate(donation.createdAt)}</span>
                        </div>
                        {donation.notes && (
                          <div className="detail-item">
                            <FaInfoCircle className="detail-icon" />
                            <span>Notes: {donation.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="card-footer">
                        <button
                          className="accept-btn"
                          onClick={() => acceptDonation(donation._id)}
                          disabled={loading}
                        >
                          Accept Task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "availableTasks" && (
            <div className="tasks-section">
              <h2>Available Tasks</h2>
              {taskError && (
                <div className="error-message">
                  <FaExclamationTriangle />
                  {taskError}
                </div>
              )}
              {taskLoading ? (
                <div className="loading">Loading tasks...</div>
              ) : availableTasks.length === 0 ? (
                <div className="empty-state">
                  <FaBoxOpen className="empty-icon" />
                  <p>No available tasks at the moment. Check back later!</p>
                </div>
              ) : (
                <div className="tasks-grid">
                  {availableTasks.map((task) => (
                    <div key={task._id} className="task-card">
                      <div className="card-header">
                        <h3>{task.donation?.food || 'Food Items'}</h3>
                        <span className={`priority-badge ${task.priority}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="detail-item">
                          <FaBoxOpen className="detail-icon" />
                          <span>Quantity: {task.donation?.quantity}</span>
                        </div>
                        <div className="detail-item">
                          <FaUser className="detail-icon" />
                          <span>From: {task.donor?.name}</span>
                        </div>
                        <div className="detail-item">
                          <FaMapMarkedAlt className="detail-icon" />
                          <span>To: {task.receiver?.name}</span>
                        </div>
                        <div className="detail-item">
                          <FaClock className="detail-icon" />
                          <span>Posted: {formatDate(task.createdAt)}</span>
                        </div>
                        <div className="detail-item">
                          <FaInfoCircle className="detail-icon" />
                          <span>Pickup: {task.pickupAddress}</span>
                        </div>
                        <div className="detail-item">
                          <FaInfoCircle className="detail-icon" />
                          <span>Delivery: {task.deliveryAddress}</span>
                        </div>
                      </div>
                      <div className="card-footer">
                        <button
                          className="accept-btn"
                          onClick={() => acceptTaskHandler(task._id)}
                          disabled={taskLoading}
                        >
                          Accept Task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "myTasks" && (
            <div className="tasks-section">
              <h2>My Assigned Tasks</h2>
              {taskError && (
                <div className="error-message">
                  <FaExclamationTriangle />
                  {taskError}
                </div>
              )}
              {taskLoading ? (
                <div className="loading">Loading tasks...</div>
              ) : assignedTasks.length === 0 ? (
                <div className="empty-state">
                  <FaRoute className="empty-icon" />
                  <p>No assigned tasks yet. Accept some tasks to get started!</p>
                </div>
              ) : (
                <div className="tasks-grid">
                  {assignedTasks.map((task) => (
                    <div key={task._id} className="task-card">
                      <div className="card-header">
                        <h3>{task.donation?.food || 'Food Items'}</h3>
                        {getStatusBadge(task.status)}
                      </div>
                      <div className="card-body">
                        <div className="detail-item">
                          <FaBoxOpen className="detail-icon" />
                          <span>Quantity: {task.donation?.quantity}</span>
                        </div>
                        <div className="detail-item">
                          <FaUser className="detail-icon" />
                          <span>From: {task.donor?.name}</span>
                        </div>
                        <div className="detail-item">
                          <FaMapMarkedAlt className="detail-icon" />
                          <span>To: {task.receiver?.name}</span>
                        </div>
                        <div className="detail-item">
                          <FaClock className="detail-icon" />
                          <span>Accepted: {formatDate(task.acceptedAt)}</span>
                        </div>
                        <div className="detail-item">
                          <FaInfoCircle className="detail-icon" />
                          <span>Pickup: {task.pickupAddress}</span>
                        </div>
                        <div className="detail-item">
                          <FaInfoCircle className="detail-icon" />
                          <span>Delivery: {task.deliveryAddress}</span>
                        </div>
                      </div>
                      <div className="card-footer">
                        {task.status === "accepted" && (
                          <button
                            className="status-btn picked-btn"
                            onClick={() => updateTaskStatusHandler(task._id, "picked_up")}
                            disabled={taskLoading}
                          >
                            Picked Up
                          </button>
                        )}
                        {task.status === "picked_up" && (
                          <button
                            className="status-btn transit-btn"
                            onClick={() => updateTaskStatusHandler(task._id, "in_transit")}
                            disabled={taskLoading}
                          >
                            In Transit
                          </button>
                        )}
                        {task.status === "in_transit" && (
                          <button
                            className="status-btn delivered-btn"
                            onClick={() => updateTaskStatusHandler(task._id, "delivered")}
                            disabled={taskLoading}
                          >
                            Mark as Delivered
                          </button>
                        )}
                        {task.status === "delivered" && (
                          <div className="completion-badge">
                            <FaCheckCircle />
                            Task Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "map" && (
            <div className="map-section">
              <h2>Donation Locations Map</h2>
              <div className="map-container">
                <VolunteerMap 
                  donations={availableDonations}
                  users={users}
                  onLocationUpdate={handleLocationUpdate}
                />
              </div>
              <div className="map-info">
                <div className="info-card">
                  <h3>📍 Map Information</h3>
                  <p>View donor and receiver locations to optimize delivery routes.</p>
                  <ul>
                    <li>🟢 Green markers: Donor locations</li>
                    <li>🔵 Blue markers: Receiver locations</li>
                    <li>🔵 Blue circle: Your current location</li>
                  </ul>
                </div>
                <div className="stats-card">
                  <h3>📊 Location Stats</h3>
                  <div className="location-stats">
                    <div className="stat-item">
                      <span className="stat-number">{availableDonations.filter(d => d.latitude && d.longitude).length}</span>
                      <span className="stat-label">Donations with Location</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{users.filter(u => u.role === 'receiver' && u.latitude && u.longitude).length}</span>
                      <span className="stat-label">Receivers with Location</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="profile-section">
              <h2>Profile</h2>
              <div className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar-container">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="profile-avatar-img"
                      />
                    ) : (
                      <FaUser className="profile-avatar" />
                    )}
                    <div className="profile-upload-btn">
                      <input
                        type="file"
                        id="profile-upload"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleProfileImageChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="profile-upload" className="upload-label">
                        <FaCamera />
                      </label>
                    </div>
                  </div>
                  <div className="profile-info">
                    <h3>{userName}</h3>
                    <p>{userEmail}</p>
                    <span className="role-badge volunteer">Volunteer</span>
                  </div>
                </div>
                <div className="profile-stats">
                  <div className="profile-stat">
                    <div className="stat-number">{assignedDonations.filter(d => d.status === "completed").length}</div>
                    <div className="stat-label">Completed Deliveries</div>
                  </div>
                  <div className="profile-stat">
                    <div className="stat-number">{assignedDonations.filter(d => d.status !== "completed").length}</div>
                    <div className="stat-label">Active Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VolunteerDashboard;

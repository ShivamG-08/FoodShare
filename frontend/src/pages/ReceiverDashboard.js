import React, { useState, useEffect } from 'react';
import { 
  FaHome, 
  FaUser, 
  FaCog, 
  FaSearch, 
  FaUsers, 
  FaBell, 
  FaSignOutAlt, 
  FaBars,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkedAlt
} from 'react-icons/fa';
import './ReceiverDashboard.css';
import { getAvailableDonations, acceptDonation as acceptDonationApi, markReceived as markReceivedApi } from '../services/donationApi';
import MapSection from '../components/MapSection';
import MapDistanceModal from '../components/MapDistanceModal';
import { uploadProfilePicture } from '../services/usersApi';
import { confirmFoodReceived } from '../services/taskApi';
import { initializeLocationTracking, stopListeningToLocationUpdates } from '../services/locationService';

const ReceiverDashboard = () => {
  const userName = (typeof window !== 'undefined' && localStorage.getItem('userName')) || (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || 'Receiver';
  const userEmail = (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || '';
  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window === 'undefined') return '';
    const role = localStorage.getItem('userRole') || 'receiver';
    const uid = localStorage.getItem('userId') || '';
    const key = uid ? `profileImage:${role}:${uid}` : 'profileImage:guest';
    // migrate old global key once
    const old = localStorage.getItem('profileImage');
    const existing = localStorage.getItem(key);
    if (!existing && old) {
      try { localStorage.setItem(key, old); } catch (_) {}
    }
    return localStorage.getItem(key) || '';
  });
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'light');
  
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      // Clear all user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      // Keep the profile image in localStorage for next login
      // localStorage.removeItem('profileImage');
      window.location.href = '/login';
    }
  };

  // Apply theme to document root and persist
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
    } catch (_) {}
  }, [theme]);

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    const uid = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '';
    const role = (typeof window !== 'undefined' && localStorage.getItem('userRole')) || 'receiver';
    const key = uid ? `profileImage:${role}:${uid}` : 'profileImage:guest';
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadProfilePicture(file);
      const url = res?.profileImageUrl || '';
      if (url) {
        setProfileImage(url);
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [acceptedDonations, setAcceptedDonations] = useState([]); // {id, at: Date}
  
  // Connections and Tasks state
  const [connections, setConnections] = useState([]); // Accepted donations with task details
  const [completedConnections, setCompletedConnections] = useState([]); // Completed tasks
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [errorConnections, setErrorConnections] = useState('');
  const [socket, setSocket] = useState(null);

  // Browse: filters and data
  const [search, setSearch] = useState('');

  const [available, setAvailable] = useState([]); // from backend
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [errorAvail, setErrorAvail] = useState('');

  // Map modal state
  const [mapOpen, setMapOpen] = useState(false);
  const [mapOrigin, setMapOrigin] = useState('');
  const [mapDestination, setMapDestination] = useState('');

  // Receiver stored location (per-user, with consent)
  const receiverId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || null;
  const locKey = receiverId ? `receiverLocation:${receiverId}` : null;
  const consentKey = receiverId ? `receiverLocationConsent:${receiverId}` : null;
  const askedKey = receiverId ? `receiverLocationAsked:${receiverId}` : null;
  const [storedLocation, setStoredLocation] = useState('');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  // Load stored location once per receiver
  useEffect(() => {
    try {
      if (!receiverId) return;
      const c = consentKey ? localStorage.getItem(consentKey) === 'true' : false;
      const loc = locKey ? localStorage.getItem(locKey) || '' : '';
      const asked = askedKey ? localStorage.getItem(askedKey) === 'true' : false;
      setHasConsent(c);
      setStoredLocation(loc);
      // Only auto-prompt once per receiver if they haven't been asked before
      if (!asked && (!c || !loc)) {
        setShowLocationPrompt(true);
        if (askedKey) localStorage.setItem(askedKey, 'true');
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverId]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const uid = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '';
        const role = (typeof window !== 'undefined' && localStorage.getItem('userRole')) || 'receiver';
        const key = uid ? `profileImage:${role}:${uid}` : 'profileImage:guest';
        if (!uid) return;
        const u = await getUser(uid);
        if (u && u.profileImageUrl) {
          setProfileImage(u.profileImageUrl);
          try { localStorage.setItem(key, u.profileImageUrl); } catch (_) {}
        }
      } catch (_) {}
    };
    loadUser();
  }, []);

  const saveStoredLocation = (value) => {
    if (!receiverId || !locKey || !consentKey) return;
    try {
      localStorage.setItem(consentKey, 'true');
      localStorage.setItem(locKey, value);
      setHasConsent(true);
      setStoredLocation(value);
      setShowLocationPrompt(false);
    } catch (e) {
      console.error('Failed to store location', e);
    }
  };

  const clearStoredLocation = () => {
    if (!receiverId || !locKey || !consentKey) return;
    try {
      localStorage.removeItem(locKey);
      // keep consent so we don't re-prompt unless user decides to set again
      setStoredLocation('');
      // Do not re-show automatically; user can click Change location when they want
    } catch (e) {
      console.error('Failed to clear location', e);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported. Please enter location manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Store as "lat,lng" string which Google Maps embed accepts
        const value = `${pos.coords.latitude},${pos.coords.longitude}`;
        saveStoredLocation(value);
      },
      (err) => {
        console.warn('Geolocation error', err);
        alert('Unable to get current location. Please enter it manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Load available donations on mount and when switching to browse
  useEffect(() => {
    const load = async () => {
      setErrorAvail('');
      setLoadingAvail(true);
      try {
        const data = await getAvailableDonations();
        setAvailable(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErrorAvail('Failed to load available donations');
      } finally {
        setLoadingAvail(false);
      }
    };
    // markAsReceived moved to component scope
    if (activeTab === 'browse' || activeTab === 'dashboard') {
      load();
    }
  }, [activeTab]);

  const filtered = available
    .filter(d => {
      // Text search only; show all donations to all receivers
      const term = search.toLowerCase();
      return (
        (d.food || '').toLowerCase().includes(term) ||
        (d.location || '').toLowerCase().includes(term) ||
        (d.donor?.name || '').toLowerCase().includes(term)
      );
    });

  const markAsReceived = async (donationId) => {
    try {
      const receiverId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      if (!receiverId) {
        alert('You must be logged in as receiver');
        return;
      }
      await markReceivedApi(donationId, receiverId);
      // Mark as received locally (keep in Connections)
      setAcceptedDonations((prev) => prev.map((a) => a.id === donationId ? { ...a, receivedAt: new Date() } : a));
      // Refresh available list (in case statuses changed)
      const data = await getAvailableDonations();
      setAvailable(Array.isArray(data) ? data : []);
      alert('Marked as received. Donor will be notified.');
    } catch (e) {
      console.error(e);
      alert('Failed to mark as received');
    }
  };

  const acceptDonation = async (donation) => {
    try {
      const receiverId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      if (!receiverId) {
        alert('You must be logged in as receiver');
        return;
      }
      const receiverLocation = (storedLocation && storedLocation.trim()) || (prefs.location && prefs.location.trim()) || '';
      await acceptDonationApi(donation.id, receiverId, receiverLocation || undefined);
      // Update local accepted list
      setAcceptedDonations((prev) => {
        if (prev.some((a) => a.id === donation.id)) return prev;
        return [...prev, { id: donation.id, at: new Date(), meta: donation }];
      });
      alert('Accepted. Donor notified.');
      // Refresh available list
      const data = await getAvailableDonations();
      setAvailable(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Failed to accept donation');
    }
  };

  // Open map from receiver to donor (component scope)
  const openMapToDonor = (donorAddress) => {
    // Use stored location if available; otherwise ask user to set now
    const originAddr = (storedLocation && storedLocation.trim()) || (prefs.location && prefs.location.trim()) || '';
    if (!originAddr) {
      setShowLocationPrompt(true);
      return;
    }
    if (!donorAddress) return;
    setMapOrigin(originAddr);
    setMapDestination(donorAddress);
    setMapOpen(true);
  };

  const hasAccepted = (id) => acceptedDonations.some((a) => a.id === id);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const todayCount = acceptedDonations.filter((a) => isSameDay(a.at, new Date())).length;

  // Settings: preferences state
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    pushAlerts: false,
    maxDistance: 10,
    theme: (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'light',
    categories: {
      cooked: true,
      produce: true,
      bakery: false,
      packaged: true,
    },
    phone: '',
    location: '',
  });

  const toggleCategory = (key) => {
    setPrefs(p => ({
      ...p,
      categories: { ...p.categories, [key]: !p.categories[key] }
    }));
  };

  const saveSettings = (e) => {
    e.preventDefault();
    // TODO: integrate with backend API
    console.log('Saving preferences', prefs);
    alert('Settings saved');
  };

  // Keep prefs.theme and global theme state in sync
  useEffect(() => {
    setPrefs(p => ({ ...p, theme }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Sync prefs.location with storedLocation for display convenience
  useEffect(() => {
    if (storedLocation && !prefs.location) {
      setPrefs(p => ({ ...p, location: storedLocation }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedLocation]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Initialize Socket.IO and location tracking
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const newSocket = initializeLocationTracking(userId, 'receiver');
      setSocket(newSocket);

      // Join user-specific room for targeted events
      newSocket.emit('user-connect', {
        userId,
        role: 'receiver',
        timestamp: new Date()
      });

      // Listen for task updates
      newSocket.on('task-accepted', (data) => {
        console.log('Task accepted event received:', data);
        if (data.receiverId === userId || data.receiver === userId) {
          console.log('Task accepted for current user, refreshing connections...');
          
          // Update connections to show volunteer details immediately
          fetchConnections();
          
          // Show real-time notification
          if (data.volunteerName) {
            alert(`${data.volunteerName} has accepted your delivery task! Check Connections for details.`);
          }
        }
      });

      newSocket.on('task-updated', (data) => {
        console.log('Task updated event received:', data);
        if (data.receiverId === userId || data.receiver === userId) {
          console.log('Task updated for current user, refreshing connections...');
          
          // Update connection status in real-time
          fetchConnections();
          
          // Update specific task in state if available
          setConnections(prev => prev.map(task => 
            task._id === data.taskId 
              ? { ...task, status: data.status, updatedAt: new Date() }
              : task
          ));
        }
      });

      newSocket.on('task-completed', (data) => {
        console.log('Task completed event received:', data);
        if (data.receiverId === userId || data.receiver === userId) {
          console.log('Task completed for current user, refreshing connections...');
          
          // Move to completed connections
          fetchConnections();
          
          // Show completion notification
          alert('Delivery completed! Thank you for confirming receipt.');
        }
      });

      // Listen for volunteer location updates (if active task)
      newSocket.on('location-update', (data) => {
        console.log('Location update received:', data);
        // Could be used to show real-time tracking in future
      });

      return () => {
        stopListeningToLocationUpdates();
        newSocket.disconnect();
      };
    }
  }, []);

  // Fetch receiver's connections (tasks with volunteer details)
  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      setErrorConnections('');
      
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      console.log('Fetching connections for userId:', userId);
      console.log('Token available:', !!token);
      
      if (!userId) {
        console.error('No userId found in localStorage');
        setErrorConnections('User ID not found. Please login again.');
        return;
      }
      
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/receiver/${userId}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch connections: ${response.status} ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Fetched response data:', responseData);
      
      // Handle structured response format
      const tasks = responseData.tasks || responseData;
      console.log('Tasks array:', tasks);
      
      // Separate active and completed connections
      const active = tasks.filter(task => task.status !== 'completed');
      const completed = tasks.filter(task => task.status === 'completed');
      
      console.log('Active connections:', active.length);
      console.log('Completed connections:', completed.length);
      
      setConnections(active);
      setCompletedConnections(completed);
      
    } catch (error) {
      console.error('Fetch connections error:', error);
      setErrorConnections(`Failed to fetch connections: ${error.message}`);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Handle Receive Food button click
  const handleReceiveFood = async (taskId, donationId) => {
    try {
      const userId = localStorage.getItem('userId');
      
      await confirmFoodReceived(taskId, userId, null, 'Food received successfully');
      
      // Refresh connections to update status
      await fetchConnections();
      
      alert('Food received successfully! Thank you for confirming.');
      
    } catch (error) {
      console.error('Receive food error:', error);
      alert('Failed to confirm food received. Please try again.');
    }
  };

  // Fetch connections when connections tab is active
  useEffect(() => {
    if (activeTab === 'connections') {
      fetchConnections();
    }
  }, [activeTab]);

  const menuItems = [
    { id: 'dashboard', icon: <FaHome />, label: 'Dashboard' },
    { id: 'browse', icon: <FaSearch />, label: 'Browse Donations' },
    { id: 'connections', icon: <FaUsers />, label: 'Connections' },
    { id: 'profile', icon: <FaUser />, label: 'Profile' },
    { id: 'settings', icon: <FaCog />, label: 'Settings' },
    { id: 'map', icon: <FaMapMarkedAlt />, label: 'Map' },
  ];

  const notifications = [
    { id: 1, text: 'New donation available near you', time: '2m ago' },
    { id: 2, text: 'Your request has been accepted', time: '1h ago' },
    { id: 3, text: 'Donation pickup scheduled for tomorrow', time: '3h ago' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h2>Welcome back, {userName} 👋</h2>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
              <div className="card" style={{ padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Nearby Donations</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>{filtered.length}</p>
                <p style={{ color: '#6b7280' }}>Matching your current filters</p>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Accepted</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>{acceptedDonations.length}</p>
                <p style={{ color: '#6b7280' }}>Awaiting pickup</p>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Today</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>{todayCount}</p>
                <p style={{ color: '#6b7280' }}>Accepted today</p>
              </div>
            </div>

            <div className="quick-actions" style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn primary" onClick={() => setActiveTab('browse')}>Browse Donations</button>
              <button className="btn" onClick={() => setActiveTab('map')}>Open Map</button>
              <button className="btn" onClick={() => setActiveTab('settings')}>Update Preferences</button>
            </div>

            <div className="suggestions" style={{ marginTop: 16 }}>
              <h3>Suggestions</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#374151' }}>
                <li>Increase your distance filter to 10–20 km to see more donations.</li>
                <li>Enable push alerts in Settings to get notified instantly.</li>
                <li>Use the Map tab to plan the quickest pickup route.</li>
              </ul>
            </div>
          </div>
        );
      case 'profile':
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
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>{userEmail || 'N/A'}</p>
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
                </div>
              </div>
            </div>
          </div>
        );
      case 'browse':
        return (
          <div className="dashboard-content">
            <h2>Browse Donations</h2>
            <div className="browse-filters">
              <input
                type="text"
                placeholder="Search items (e.g., bread, rice)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {/* Category/Distance filters not available from backend data; keeping UI minimal */}
              <div></div>
              <div></div>
              <div></div>
            </div>

            <div className="donations-grid">
              {loadingAvail && <div className="empty-state">Loading...</div>}
              {errorAvail && <div className="empty-state">{errorAvail}</div>}
              {!loadingAvail && !errorAvail && filtered.map((d) => (
                <div key={d._id} className="donation-card">
                  <div className="donation-header">
                    <h3>{d.food}</h3>
                    <span className={`badge-cat cooked`}>{d.status}</span>
                  </div>
                  <div className="donation-meta">
                    <span><strong>Quantity:</strong> {d.quantity}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>Location:</strong> {d.location}
                      <button
                        className="btn"
                        type="button"
                        onClick={() => openMapToDonor(d.location)}
                        title="Show distance and route"
                      >
                        <FaMapMarkedAlt style={{ marginRight: 6 }} /> Map
                      </button>
                    </span>
                    <span><strong>Donor:</strong> {d.donor?.name || 'Anonymous'}</span>
                    <span><strong>Donor Email:</strong> {d.donor?.email || 'N/A'}</span>
                    <span><strong>Date:</strong> {new Date(d.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="donation-actions">
                    <button
                      className="btn accept"
                      onClick={() => acceptDonation({
                        id: d._id,
                        food: d.food,
                        quantity: d.quantity,
                        location: d.location,
                        donor: d.donor,
                        createdAt: d.createdAt,
                      })}
                      disabled={hasAccepted(d._id)}
                    >
                      {hasAccepted(d._id) ? 'Accepted' : 'Accept'}
                    </button>
                    {hasAccepted(d._id) ? (
                      <button className="btn" onClick={() => markAsReceived(d._id)}>Mark Received</button>
                    ) : (
                      <button className="btn details">Details</button>
                    )}
                  </div>
                </div>
              ))}
              {!loadingAvail && !errorAvail && filtered.length === 0 && (
                <div className="empty-state">
                  No donations match your filters. Try expanding your distance or clearing search.
                </div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="dashboard-content">
            <h2>Settings</h2>
            <form className="settings-form" onSubmit={saveSettings}>
              <div className="form-row two-col">
                <div className="form-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="Your phone"
                    value={prefs.phone}
                    onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="City / Area"
                    value={prefs.location}
                    onChange={(e) => setPrefs({ ...prefs, location: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="btn" onClick={() => setShowLocationPrompt(true)}>Change location</button>
                    {storedLocation && (
                      <button type="button" className="btn" onClick={clearStoredLocation} title="Clear stored location from this device">Clear stored location</button>
                    )}
                    {!storedLocation && (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>No stored location yet.</span>
                    )}
                  </div>
                  {storedLocation && (
                    <div style={{ marginTop: 6, fontSize: 13, color: '#374151' }}>
                      <strong>Stored:</strong> {storedLocation}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <label>Notifications</label>
                <div className="switches">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={prefs.emailAlerts}
                      onChange={(e) => setPrefs({ ...prefs, emailAlerts: e.target.checked })}
                    />
                    <span>Email alerts</span>
                  </label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={prefs.pushAlerts}
                      onChange={(e) => setPrefs({ ...prefs, pushAlerts: e.target.checked })}
                    />
                    <span>Push alerts</span>
                  </label>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-field">
                  <label>Max distance (km)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={prefs.maxDistance}
                    onChange={(e) => setPrefs({ ...prefs, maxDistance: Number(e.target.value) })}
                  />
                </div>
                <div className="form-field">
                  <label>Theme</label>
                  <select
                    value={prefs.theme}
                    onChange={(e) => { const val = e.target.value; setPrefs({ ...prefs, theme: val }); setTheme(val); }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label>Preferred categories</label>
                <div className="chips">
                  {['cooked','produce','bakery','packaged'].map(cat => (
                    <button
                      type="button"
                      key={cat}
                      className={`chip ${prefs.categories[cat] ? 'active' : ''}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="actions">
                <button type="submit" className="save-btn">Save Settings</button>
              </div>
            </form>
          </div>
        );
      case 'connections':
        return (
          <div className="dashboard-content">
            <h2>Connections</h2>
            
            {/* Active Connections Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Active Connections</h3>
              {loadingConnections ? (
                <div className="card">Loading connections...</div>
              ) : errorConnections ? (
                <div className="card" style={{ color: '#dc2626' }}>{errorConnections}</div>
              ) : connections.length === 0 ? (
                <div className="card">
                  <p>No active connections. Accept a donation to see it here.</p>
                </div>
              ) : (
                <div className="connections-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {connections.map((task) => (
                    <div key={task._id} className="card connection-card" style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                      {/* Donor Details */}
                      <div className="connection-section" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Donor Details</h4>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                          <strong>Name:</strong> {task.donor?.name || 'Anonymous'}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                          <strong>Email:</strong> {task.donor?.email || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                          <strong>Phone:</strong> {task.donor?.phone || 'N/A'}
                        </p>
                        {task.donor?.profileImageUrl && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <img 
                              src={task.donor.profileImageUrl} 
                              alt="Donor" 
                              style={{ 
                                width: '50px', 
                                height: '50px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '2px solid #e5e7eb'
                              }} 
                            />
                          </div>
                        )}
                      </div>

                      {/* Volunteer Details (only show if volunteer is assigned) */}
                      {task.volunteer && (
                        <div className="connection-section" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Volunteer Details</h4>
                          <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                            <strong>Name:</strong> {task.volunteer?.name || 'N/A'}
                          </p>
                          <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                            <strong>Email:</strong> {task.volunteer?.email || 'N/A'}
                          </p>
                          <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                            <strong>Phone:</strong> {task.volunteer?.phone || 'N/A'}
                          </p>
                          {task.volunteer?.profileImageUrl && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <img 
                                src={task.volunteer.profileImageUrl} 
                                alt="Volunteer" 
                                className="volunteer-profile-img"
                                style={{ 
                                  width: '60px', 
                                  height: '60px', 
                                  borderRadius: '50%', 
                                  objectFit: 'cover',
                                  border: '2px solid #e5e7eb'
                                }} 
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Food Details */}
                      <div className="connection-section" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Food Details</h4>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                          <strong>Item:</strong> {task.donation?.food || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                          <strong>Quantity:</strong> {task.donation?.quantity || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                          <strong>Pickup Location:</strong> {task.pickupAddress || task.donation?.location || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                          <strong>Delivery Location:</strong> {task.deliveryAddress || 'Your location'}
                        </p>
                      </div>

                      {/* Delivery Status */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Delivery Status</h4>
                        <div 
                          className={`status-badge status-${task.status}`}
                          style={{ 
                            padding: '0.5rem 1rem', 
                            borderRadius: '4px', 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            backgroundColor: getStatusColor(task.status),
                            color: '#fff'
                          }}
                        >
                          {task.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        </div>
                      </div>

                      {/* Receive Food Button - Only show when task is delivered */}
                      {task.status === 'delivered' && (
                        <div style={{ textAlign: 'center' }}>
                          <button
                            className="receive-food-btn"
                            onClick={() => handleReceiveFood(task._id, task.donation._id)}
                            style={{ 
                              padding: '0.75rem 2rem',
                              fontSize: '1rem',
                              fontWeight: 'bold'
                            }}
                          >
                            Receive Food
                          </button>
                          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            Click to confirm you have received food items
                          </p>
                        </div>
                      )}

                      {/* Show completion info if already completed */}
                      {task.status === 'completed' && (
                        <div style={{ textAlign: 'center', color: '#059669' }}>
                          <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>✅ Completed</p>
                          <p style={{ margin: '0', fontSize: '0.875rem' }}>
                            Food received on {new Date(task.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Show waiting for volunteer if no volunteer assigned */}
                      {!task.assignedVolunteer && task.status === 'pending' && (
                        <div style={{ textAlign: 'center', color: '#6b7280' }}>
                          <p style={{ margin: '0.5rem 0', fontStyle: 'italic' }}>
                            Waiting for volunteer assignment...
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Connections Section */}
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Completed Connections</h3>
              {completedConnections.length === 0 ? (
                <div className="card">
                  <p>No completed connections yet.</p>
                </div>
              ) : (
                <div className="connections-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {completedConnections.map((task) => (
                    <div key={task._id} className="card completed-connection" style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', opacity: '0.8' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                        {task.donation?.food || 'Food Item'}
                      </h4>
                      <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                        <strong>From:</strong> {task.donor?.name || 'Anonymous'}
                      </p>
                      <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                        <strong>Delivered by:</strong> {task.volunteer?.name || 'Volunteer'}
                      </p>
                      <p style={{ margin: '0.25rem 0', color: '#059669' }}>
                        <strong>Completed on:</strong> {new Date(task.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

  // Helper function to get status color
  function getStatusColor(status) {
    switch (status) {
      case 'pending': return '#6b7280';
      case 'accepted': return '#3b82f6';
      case 'picked_up': return '#f59e0b';
      case 'in_transit': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'completed': return '#059669';
      default: return '#6b7280';
    }
  }
      case 'map':
        return (
          <div className="dashboard-content">
            <h2>Nearby Donations</h2>
            <MapSection
              title="Receiver Map"
              role="receiver"
              initialRadiusKm={6}
              markers={[
                { id: 1, position: { lat: 19.08, lng: 72.88 }, label: 'Donation: Bakery (20 items)', color: '#f59e0b' },
                { id: 2, position: { lat: 19.07, lng: 72.87 }, label: 'Donation: Cooked Meals (12 servings)', color: '#f59e0b' },
                { id: 3, position: { lat: 19.05, lng: 72.86 }, label: 'Donation: Produce (2 crates)', color: '#f59e0b' },
              ]}
            />
          </div>
        );
      default:
        return <div className="dashboard-content">
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          <p>This is the {activeTab} section.</p>
        </div>;
    }
  };

  return (
    <>
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!sidebarCollapsed && <h2>FoodShare</h2>}
          <button className="toggle-btn" onClick={toggleSidebar}>
            {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li 
                key={item.id}
                className={activeTab === item.id ? 'active' : ''}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="icon">{item.icon}</span>
                {!sidebarCollapsed && <span className="label">{item.label}</span>}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <header className="top-nav">
          <div className="nav-left">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          </div>
          <div className="nav-right">
            <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
              <FaBell />
              <span className="badge">3</span>
              {showNotifications && (
                <div className="notification-dropdown">
                  <h4>Notifications</h4>
                  {notifications.map(notification => (
                    <div key={notification.id} className="notification-item">
                      <p>{notification.text}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  ))}
                  <button className="view-all">View All Notifications</button>
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
                fontWeight: 500,
                height: '40px',
                fontSize: '14px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              <FaSignOutAlt size={16} />
              <span>Logout</span>
            </button>
            <div className="profile-dropdown" style={{ position: 'relative' }}>
              <div 
                className="user-avatar"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 12px', 
                  borderRadius: '4px' 
                }}
              >
                <div
                  onClick={() => { const el = document.getElementById('nav-profile-upload'); if (el) el.click(); }}
                  title="Change profile picture"
                  style={{ cursor: 'pointer' }}
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
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}>
                      <FaUser style={{ color: '#4b5563' }} />
                    </div>
                  )}
                </div>
                <input
                  id="nav-profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
                <span 
                  className="username" 
                  style={{ fontWeight: 500, cursor: 'pointer' }}
                  onClick={() => setShowProfile(!showProfile)}
                >
                  {userName}
                </span>
              </div>

              {showProfile && (
                <div 
                  className="profile-menu"
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
                    onClick={() => { setActiveTab('profile'); setShowProfile(false); }}
                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background-color 0.2s', color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}
                  >
                    <FaUser size={16} style={{ color: '#6b7280' }} />
                    <span>Profile</span>
                  </div>
                  <div 
                    className="profile-dropdown-item"
                    onClick={() => { setActiveTab('settings'); setShowProfile(false); }}
                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background-color 0.2s', color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}
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
          </div>
        </header>

        {/* Page Content */}
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
    {showLocationPrompt && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#fff', width: '92%', maxWidth: 520, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Share your location</h3>
            <button className="close-btn" onClick={() => setShowLocationPrompt(false)} aria-label="Close">&times;</button>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, color: '#374151' }}>We use your location to show nearby donations. With your consent, we'll store it on this device and you can change or clear it anytime in Settings.</p>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} />
              <span>I consent to storing my location on this device for improved matching.</span>
            </label>
            <div>
              <label style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>Enter location manually (address, area or lat,lng)</label>
              <input
                type="text"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder="e.g., Andheri West, Mumbai or 19.07,72.88"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8 }}
              />
            </div>
          </div>
          <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" onClick={() => setShowLocationPrompt(false)}>Not now</button>
            <button className="btn" onClick={useCurrentLocation} disabled={!consentChecked}>Use my current location</button>
            <button className="btn primary" onClick={() => { if (!consentChecked) return; if (manualLocation.trim()) saveStoredLocation(manualLocation.trim()); }} disabled={!consentChecked || !manualLocation.trim()}>Save manual</button>
          </div>
        </div>
      </div>
    )}
    {mapOpen && (
      <MapDistanceModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        origin={mapOrigin}
        destination={mapDestination}
        title="Receiver to Donor Directions"
      />
    )}
    </>
  );
};

export default ReceiverDashboard;

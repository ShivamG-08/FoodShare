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

const ReceiverDashboard = () => {
  const userName = (typeof window !== 'undefined' && localStorage.getItem('userName')) || (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || 'Receiver';
  const userEmail = (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || '';
  const userRole = (typeof window !== 'undefined' && localStorage.getItem('userRole')) || 'receiver';
  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('profileImage') || '';
    }
    return '';
  });
  const [isUploading, setIsUploading] = useState(false);
  
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [acceptedDonations, setAcceptedDonations] = useState([]); // {id, at: Date}

  // Browse: filters and data
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [distance, setDistance] = useState('10');
  const [sortBy, setSortBy] = useState('nearest');

  const [available, setAvailable] = useState([]); // from backend
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [errorAvail, setErrorAvail] = useState('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filtered = available
    .filter(d => {
      const term = search.toLowerCase();
      const donorName = d.donor?.name?.toLowerCase() || '';
      return (
        d.food?.toLowerCase().includes(term) ||
        d.location?.toLowerCase().includes(term) ||
        donorName.includes(term)
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
      // Remove from accepted list locally
      setAcceptedDonations((prev) => prev.filter((a) => a.id !== donationId));
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
      await acceptDonationApi(donation.id, receiverId);
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
    theme: 'light',
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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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
                    <span><strong>Location:</strong> {d.location}</span>
                    <span><strong>Donor:</strong> {d.donor?.name || 'Anonymous'}</span>
                    <span><strong>Donor Email:</strong> {d.donor?.email || 'N/A'}</span>
                    <span><strong>Date:</strong> {new Date(d.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="donation-actions">
                    <button
                      className="btn accept"
                      onClick={() => acceptDonation({ id: d._id, title: d.food })}
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
                    onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}
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
                onClick={() => setShowProfile(!showProfile)}
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

              {showProfile && (
                <div 
                  className="profile-menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '240px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 10,
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    className="profile-header"
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                  >
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '3px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '80px', 
                          height: '80px', 
                          borderRadius: '50%', 
                          backgroundColor: '#e5e7eb', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: '3px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          <FaUser size={32} style={{ color: '#6b7280' }} />
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
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        {isUploading ? (
                          <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: '#fff', animation: 'spin 1s ease-in-out infinite' }}></div>
                        ) : (
                          <FaUser size={12} />
                        )}
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
                    <h4 style={{ margin: '8px 0 4px', color: '#111827' }}>{userName}</h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{userEmail || 'No email'}</p>
                    <div style={{ 
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </div>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    <div 
                      className="profile-dropdown-item"
                      onClick={() => {
                        setActiveTab('profile');
                        setShowProfile(false);
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
                      <span>My Profile</span>
                    </div>
                    <div 
                      className="profile-dropdown-item"
                      onClick={() => {
                        setActiveTab('settings');
                        setShowProfile(false);
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
  );
};

export default ReceiverDashboard;

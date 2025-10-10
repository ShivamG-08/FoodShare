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

const ReceiverDashboard = () => {
  const userName = (typeof window !== 'undefined' && localStorage.getItem('userName')) || (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || 'Receiver';
  const userRole = (typeof window !== 'undefined' && localStorage.getItem('userRole')) || 'receiver';
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
  const [hasConsent, setHasConsent] = useState(false);
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
            <div 
              className="profile-dropdown" 
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="avatar">
                <FaUser />
              </div>
              {showProfile && (
                <div className="profile-menu">
                  <div className="profile-header">
                    <div className="profile-avatar">
                      <FaUser size={40} />
                    </div>
                    <div className="profile-info">
                      <h4>{userName}</h4>
                      <span>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
                    </div>
                  </div>
                  <ul>
                    <li><FaUser /> My Profile</li>
                    <li><FaCog /> Settings</li>
                    <li className="logout"><FaSignOutAlt /> Logout</li>
                  </ul>
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

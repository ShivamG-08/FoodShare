import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAllDonations } from "../services/donationApi";
import {
  FaTachometerAlt,
  FaUsers,
  FaBoxOpen,
  FaChartBar,
  FaCog,
  FaBell,
  FaSearch,
} from "react-icons/fa";
import "./AdminDashboard.css";

function StatCard({ title, value, sub, icon }) {
  return (
    <div className="ad-stat">
      <div className="ad-stat-icon">{icon}</div>
      <div className="ad-stat-body">
        <div className="ad-stat-title">{title}</div>
        <div className="ad-stat-value">{value}</div>
        <div className="ad-stat-sub">{sub}</div>
      </div>
    </div>
  );
}

const mockUsers = [];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");

  // Local users state so admin actions (add donor/receiver) reflect in tables
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDonations: 0,
    mealsServed: 0 // We'll keep this as a static value for now
  });

  // Modal state
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", status: "active" });
  
  // Admin settings state
  const [settings, setSettings] = useState({
    orgName: "FoodShare",
    supportEmail: "support@foodshare.org",
    defaultRole: "receiver",
    maintenance: "off",
  });
  
  const saveSettings = () => {
    // TODO: integrate with backend API
    console.log("Saving admin settings", settings);
    alert("Settings saved");
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    // Fetch users
    const fetchUsers = axios.get("http://localhost:5000/api/users");
    // Fetch donations
    const fetchDonations = getAllDonations();

    Promise.all([fetchUsers, fetchDonations])
      .then(([usersRes, donationsData]) => {
        if (!active) return;
        
        // Process users
        const userList = Array.isArray(usersRes.data?.users) ? usersRes.data.users : [];
        const mappedUsers = userList.map((u) => ({
          id: u._id || u.id,
          name: u.name,
          role: u.role,
          email: u.email,
          status: "active",
        }));
        setUsers(mappedUsers);
        
        // Process donations
        const donationsList = Array.isArray(donationsData) ? donationsData : [];
        setDonations(donationsList);
        
        // Update stats
        setStats({
          totalUsers: userList.length,
          activeDonations: donationsList.filter(d => d.status !== 'completed').length,
          mealsServed: 105000 // Static value for now
        });
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );
  const filteredDonations = donations.filter((d) => {
    const donorName = d.userId?.name || 'Unknown Donor';
    return (
      d.food?.toLowerCase().includes(query.toLowerCase()) ||
      donorName.toLowerCase().includes(query.toLowerCase()) ||
      d.status?.toLowerCase().includes(query.toLowerCase())
    );
  });
  const filteredDonors = users.filter(
    (u) => u.role === "donor" && (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );
  const filteredReceivers = users.filter(
    (u) => u.role === "receiver" && (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );

  const openDonorModal = () => {
    setForm({ name: "", email: "", status: "active" });
    setShowDonorModal(true);
  };

  const openReceiverModal = () => {
    setForm({ name: "", email: "", status: "active" });
    setShowReceiverModal(true);
  };

  const closeModals = () => {
    setShowDonorModal(false);
    setShowReceiverModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitDonor = () => {
    if (!form.name || !form.email) return;
    setUsers((prev) => [
      ...prev,
      { id: Date.now(), name: form.name, role: "donor", email: form.email, status: form.status },
    ]);
    closeModals();
  };

  const submitReceiver = () => {
    if (!form.name || !form.email) return;
    setUsers((prev) => [
      ...prev,
      { id: Date.now(), name: form.name, role: "receiver", email: form.email, status: form.status },
    ]);
    closeModals();
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-brand">FoodShare Admin</div>
        <nav>
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
            <FaTachometerAlt /> <span>Overview</span>
          </button>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
            <FaUsers /> <span>Users</span>
          </button>
          <button className={tab === "donors" ? "active" : ""} onClick={() => setTab("donors")}>
            <FaUsers /> <span>Donors</span>
          </button>
          <button className={tab === "receivers" ? "active" : ""} onClick={() => setTab("receivers")}>
            <FaUsers /> <span>Receivers</span>
          </button>
          <button className={tab === "donations" ? "active" : ""} onClick={() => setTab("donations")}>
            <FaBoxOpen /> <span>Donations</span>
          </button>
          <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")}>
            <FaChartBar /> <span>Reports</span>
          </button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>
            <FaCog /> <span>Settings</span>
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="left">
            <h1>{tab.charAt(0).toUpperCase() + tab.slice(1)}</h1>
          </div>
          <div className="right">
            <div className="search">
              <FaSearch />
              <input
                placeholder="Search users/donations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="bell"><FaBell /></button>
          </div>
        </header>

        {tab === "overview" && (
          <section>
            <div className="ad-stats">
              <StatCard 
                title="Total Users" 
                value={stats.totalUsers.toLocaleString()} 
                sub={`${Math.floor(Math.random() * 20) + 10} this week`} 
                icon={<FaUsers />} 
              />
              <StatCard 
                title="Active Donations" 
                value={stats.activeDonations.toLocaleString()} 
                sub={`${Math.floor(Math.random() * 5) + 1} expiring soon`} 
                icon={<FaBoxOpen />} 
              />
              <StatCard 
                title="Meals Served" 
                value={Math.floor(stats.mealsServed / 1000) + 'k+'} 
                sub={`+${Math.floor(Math.random() * 200) + 100} today`} 
                icon={<FaChartBar />} 
              />
            </div>
            <div className="ad-panel">
              <h3>Recent Donations</h3>
              <table className="ad-table">
                <thead>
                  <tr><th>ID</th><th>Title</th><th>Donor</th><th>Qty</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">Loading donations...</td>
                    </tr>
                  ) : filteredDonations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">No donations found</td>
                    </tr>
                  ) : (
                    filteredDonations.map((d) => (
                      <tr key={d._id}>
                        <td>{d.food || 'N/A'}</td>
                        <td>{d.userId?.name || 'Unknown Donor'}</td>
                        <td>{d.quantity || 'N/A'}</td>
                        <td>
                          <span className={`ad-status-badge ${d.status || 'pending'}`}>
                            {d.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          {d.assignedTo?.name ? `Assigned to: ${d.assignedTo.name}` : 'Not assigned'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "users" && (
          <section className="ad-panel">
            <div className="panel-head">
              <h3>Users</h3>
              <div className="panel-actions">
                <button className="btn primary">Add User</button>
              </div>
            </div>
            <table className="ad-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.role}</td>
                    <td>{u.email}</td>
                    <td><span className={`status ${u.status}`}>{u.status}</span></td>
                    <td className="row-actions">
                      <button className="btn sm">View</button>
                      <button className="btn sm">Edit</button>
                      <button className="btn sm danger">{u.status === 'blocked' ? 'Unblock' : 'Block'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "donors" && (
          <section className="ad-panel">
            <div className="panel-head">
              <h3>Donors</h3>
              <div className="panel-actions">
                <button className="btn primary" onClick={openDonorModal}>Add Donor</button>
              </div>
            </div>
            <table className="ad-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredDonors.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`status ${u.status}`}>{u.status}</span></td>
                    <td className="row-actions">
                      <button className="btn sm">View</button>
                      <button className="btn sm">Edit</button>
                      <button className="btn sm danger">{u.status === 'blocked' ? 'Unblock' : 'Block'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "receivers" && (
          <section className="ad-panel">
            <div className="panel-head">
              <h3>Receivers</h3>
              <div className="panel-actions">
                <button className="btn primary" onClick={openReceiverModal}>Add Receiver</button>
              </div>
            </div>
            <table className="ad-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredReceivers.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`status ${u.status}`}>{u.status}</span></td>
                    <td className="row-actions">
                      <button className="btn sm">View</button>
                      <button className="btn sm">Edit</button>
                      <button className="btn sm danger">{u.status === 'blocked' ? 'Unblock' : 'Block'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "donations" && (
          <section className="ad-panel">
            <div className="panel-head">
              <h3>Donations</h3>
              <div className="panel-actions">
                <button className="btn">Export</button>
              </div>
            </div>
            <table className="ad-table">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Donor</th><th>Qty</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">Loading donations...</td>
                  </tr>
                ) : filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">No donations found</td>
                  </tr>
                ) : (
                  filteredDonations.map((d) => (
                    <tr key={d._id}>
                      <td>{d.food || 'N/A'}</td>
                      <td>{d.userId?.name || 'Unknown Donor'}</td>
                      <td>{d.quantity || 'N/A'}</td>
                      <td>
                        <span className={`ad-status-badge ${d.status || 'pending'}`}>
                          {d.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        {d.assignedTo?.name ? `Assigned to: ${d.assignedTo.name}` : 'Not assigned'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}

        {tab === "reports" && (
          <section className="ad-panel">
            <h3>Reports</h3>
            <p>Download weekly/monthly performance reports.</p>
            <div className="report-actions">
              <button className="btn primary">Download Weekly</button>
              <button className="btn">Download Monthly</button>
            </div>
          </section>
        )}

        {tab === "settings" && (
          <section className="ad-panel">
            <h3>Admin Settings</h3>
            <div className="form-grid">
              <label>
                Organization Name
                <input
                  value={settings.orgName}
                  onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                />
              </label>
              <label>
                Support Email
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </label>
              <label>
                Default Role
                <select
                  value={settings.defaultRole}
                  onChange={(e) => setSettings({ ...settings, defaultRole: e.target.value })}
                >
                  <option value="receiver">Receiver</option>
                  <option value="donor">Donor</option>
                </select>
              </label>
              <label>
                Maintenance Mode
                <select
                  value={settings.maintenance}
                  onChange={(e) => setSettings({ ...settings, maintenance: e.target.value })}
                >
                  <option value="off">Off</option>
                  <option value="on">On</option>
                </select>
              </label>
            </div>
            <div className="actions">
              <button className="btn primary" onClick={saveSettings}>Save</button>
            </div>
          </section>
        )}
      </main>
      {/* Simple Modals */}
      {(showDonorModal || showReceiverModal) && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{showDonorModal ? "Add Donor" : "Add Receiver"}</h3>
            <div className="form-grid">
              <label>
                Name
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="Full name or org" />
              </label>
              <label>
                Email
                <input name="email" value={form.email} onChange={handleFormChange} placeholder="email@example.com" />
              </label>
              <label>
                Status
                <select name="status" value={form.status} onChange={handleFormChange}>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>
            </div>
            <div className="actions" style={{ display: 'flex', gap: 8 }}>
              {showDonorModal ? (
                <button className="btn primary" onClick={submitDonor}>Save Donor</button>
              ) : (
                <button className="btn primary" onClick={submitReceiver}>Save Receiver</button>
              )}
              <button className="btn" onClick={closeModals}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

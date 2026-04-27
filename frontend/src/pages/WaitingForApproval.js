import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './WaitingForApproval.css';

const WaitingForApproval = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || '';
    const userId = localStorage.getItem('userId') || '';
    
    setUserEmail(email);
    setUserName(name);

    // Initialize Socket.IO connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join user's personal room
    if (userId) {
      newSocket.emit('join-user-room', userId);
    }

    // Listen for status updates
    newSocket.on('status-update', (notification) => {
      console.log('Received notification:', notification);
      
      // Add notification to list
      setNotifications(prev => [notification, ...prev]);
      
      // Handle different notification types
      if (notification.type === 'success') {
        // Account approved - redirect to login
        setTimeout(() => {
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          navigate('/login');
        }, 3000);
      } else if (notification.type === 'error') {
        // Account rejected - redirect to login
        setTimeout(() => {
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          navigate('/login');
        }, 5000);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [navigate]);

  const removeNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <div className="waiting-container">
      <div className="waiting-card">
        <div className="waiting-header">
          <div className="logo-section">
            <h1>FoodShare</h1>
            <p>Connecting Surplus Food with Those in Need</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="waiting-content">
          <div className="status-section">
            <div className="status-icon">
              <div className="hourglass"></div>
            </div>
            <h2>Account Under Verification</h2>
            <p>Hi <strong>{userName}</strong>,</p>
            <p>Your FoodShare account is currently being reviewed by our admin team.</p>
          </div>

          <div className="info-section">
            <h3>What happens next?</h3>
            <div className="timeline">
              <div className="timeline-item completed">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <h4>Registration Submitted</h4>
                  <p>Your account has been created successfully</p>
                </div>
              </div>
              <div className="timeline-item active">
                <div className="timeline-dot pulse"></div>
                <div className="timeline-content">
                  <h4>Admin Review</h4>
                  <p>Our team is verifying your information and documents</p>
                </div>
              </div>
              <div className="timeline-item pending">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <h4>Account Activation</h4>
                  <p>You'll receive an email and notification once approved</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-section">
            <h3>Need Help?</h3>
            <p>If you haven't heard back within 24 hours, please contact our support team:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> foodshare.support@example.com</p>
              <p><strong>Phone:</strong> +1-234-567-8900</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="notifications-container">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`notification ${notification.type}`}
              onClick={() => removeNotification(index)}
            >
              <div className="notification-icon">
                {notification.type === 'success' && ' '}
                {notification.type === 'error' && ' '}
                {notification.type === 'info' && ' '}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
              </div>
              <button className="notification-close">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WaitingForApproval;

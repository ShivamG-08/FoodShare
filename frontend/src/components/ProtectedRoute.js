import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole, children }) => {
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'auth' | 'unauth'
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (role === allowedRole && token) {
        setAuthState('auth');
      } else {
        setAuthState('unauth');
      }
    };

    checkAuth();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'userRole' || e.key === 'token') {
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
    };
  }, [allowedRole]);

  useEffect(() => {
    if (authState === 'unauth') {
      const loginPath = allowedRole === 'admin' ? '/admin-login' : '/login';
      navigate(loginPath, { replace: true, state: { from: location } });
    }
  }, [authState, navigate, location, allowedRole]);

  if (authState === 'checking') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  if (authState === 'auth') {
    return children;
  }

  return null;
};

export default ProtectedRoute;

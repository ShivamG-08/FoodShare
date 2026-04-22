import io from 'socket.io-client';

let socket = null;
let locationInterval = null;
let currentTaskId = null;

// Initialize location tracking
export const initializeLocationTracking = (userId, userRole) => {
  if (!socket) {
    socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    
    // Connect with user info
    socket.emit('user-connect', {
      userId,
      role: userRole,
      timestamp: new Date()
    });
    
    console.log('Location tracking initialized for user:', userId);
  }
  
  return socket;
};

// Start tracking location for a specific task
export const startLocationTracking = (taskId, volunteerId) => {
  if (!socket || !taskId || !volunteerId) {
    console.error('Socket not initialized or missing parameters');
    return;
  }
  
  currentTaskId = taskId;
  
  // Clear any existing interval
  if (locationInterval) {
    clearInterval(locationInterval);
  }
  
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported by this browser');
    return;
  }
  
  // Start sending location updates every 30 seconds
  locationInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Emit location update
        socket.emit('location-update', {
          taskId: currentTaskId,
          volunteerId,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(),
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0
        });
        
        console.log('Location sent:', { latitude, longitude, accuracy });
      },
      (error) => {
        console.error('Error getting location:', error);
        
        // Emit error status
        socket.emit('location-update', {
          taskId: currentTaskId,
          volunteerId,
          error: error.message,
          timestamp: new Date()
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );
  }, 30000); // Send location every 30 seconds
  
  // Send initial location immediately
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      socket.emit('location-update', {
        taskId: currentTaskId,
        volunteerId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(),
        initial: true
      });
    },
    (error) => {
      console.error('Error getting initial location:', error);
    }
  );
  
  console.log('Location tracking started for task:', taskId);
};

// Stop location tracking
export const stopLocationTracking = () => {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
  
  currentTaskId = null;
  console.log('Location tracking stopped');
};

// Get current location once
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// Listen for location updates (for donors and receivers)
export const listenToLocationUpdates = (taskId, callback) => {
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  
  // Join task-specific room for location updates
  socket.emit('join-task-location', { taskId });
  
  // Listen for location updates
  socket.on('location-update', (data) => {
    if (data.taskId === taskId) {
      callback(data);
    }
  });
  
  // Listen for volunteer connection status
  socket.on('volunteer-status', (data) => {
    if (data.taskId === taskId) {
      callback({
        ...data,
        type: 'status'
      });
    }
  });
  
  console.log('Listening to location updates for task:', taskId);
};

// Stop listening to location updates
export const stopListeningToLocationUpdates = (taskId) => {
  if (!socket) return;
  
  socket.emit('leave-task-location', { taskId });
  socket.off('location-update');
  socket.off('volunteer-status');
  
  console.log('Stopped listening to location updates for task:', taskId);
};

// Disconnect from socket
export const disconnectLocationTracking = () => {
  stopLocationTracking();
  
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  console.log('Location tracking disconnected');
};

// Calculate distance between two points
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Format location for display
export const formatLocation = (latitude, longitude) => {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

// Check if location is within acceptable range
export const isLocationAccurate = (accuracy) => {
  return accuracy && accuracy <= 100; // Accept locations within 100 meters
};

export default {
  initializeLocationTracking,
  startLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
  listenToLocationUpdates,
  stopListeningToLocationUpdates,
  disconnectLocationTracking,
  calculateDistance,
  formatLocation,
  isLocationAccurate
};

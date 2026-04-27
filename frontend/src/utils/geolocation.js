// Geolocation utility functions for FoodShare

// Get current user location
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
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Get address from coordinates using reverse geocoding
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.warn('Google Maps API key not configured');
      return null;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return null;
  }
};

// Get coordinates from address using geocoding
export const getCoordinatesFromAddress = async (address) => {
  try {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.warn('Google Maps API key not configured');
      return null;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates from address:', error);
    return null;
  }
};

// Calculate distance between two coordinates (Haversine formula)
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
  
  return distance; // Distance in kilometers
};

// Default location (Mumbai)
export const DEFAULT_LOCATION = {
  lat: 19.0760,
  lng: 72.8777,
  zoom: 12
};

// Map marker icons for different roles
export const MARKER_ICONS = {
  donor: {
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40ODE0MiAyIDIgMiA2LjQ4MTQyVjE5LjMzMzdDggMjEuMzMzMyA4IDIxLjMzMzNDguNTE4NiAyMS4zMzMzIDguNTE4NiAyMC4yNDk5IDguNTE4NiAyMC4yNDk5QzguNTE4NiAxOS4yNjY2IDguNzUgMTguMzU0MiA5LjI1IDE3LjVMMTIgMTRMMTQuNzUgMTcuNUMxNS4yNSAxOC4zNTQyIDENS40ODE0IDE5LjI2NjYgMTUuNDgxNCAyMC4yNDk5QzE1LjQ4MTQgMjEuMzMzMyAxNC41MTg2IDIxLjMzMzMgMTIgMjEuMzMzM1oiIGZpbGw9IiM0QUY5RTUiLz4KPC9zdmc+',
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 32 }
  },
  receiver: {
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40ODE0MiAyIDIgMiA2LjQ4MTQyVjE5LjMzMzdDggMjEuMzMzMyA4IDIxLjMzMzNDguNTE4NiAyMS4zMzMzIDguNTE4NiAyMC4yNDk5IDguNTE4NiAyMC4yNDk5QzguNTE4NiAxOS4yNjY2IDguNzUgMTguMzU0MiA5LjI1IDE3LjVMMTIgMTRMMTQuNzUgMTcuNUMxNS4yNSAxOC4zNTQyIDE1LjQ4MTQgMTkuMjY2NiAxNS40ODE0IDIwLjI0OTlDMTUuNDgxNCAyMS4zMzMzIDE0LjUxODYgMjEuMzMzMyAxMiAyMS4zMzM1WiIgZmlsbD0iIzEwQjk4MSIvPgo8L3N2Zz4=',
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 32 }
  },
  volunteer: {
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40ODE0MiAyIDIgMiA2LjQ4MTQyVjE5LjMzMzdDggMjEuMzMzMyA4IDIxLjMzMzNDguNTE4NiAyMS4zMzMzIDguNTE4NiAyMC4yNDk5IDguNTE4NiAyMC4yNDk5QzguNTE4NiAxOS4yNjY2IDguNzUgMTguMzU0MiA5LjI1IDE3LjVMMTIgMTRMMTQuNzUgMTcuNUMxNS4yNSAxOC4zNTQyIDE1LjQ4MTQgMTkuMjY2NiAxNS40ODE0IDIwLjI0OTlDMTUuNDgxNCAyMS4zMzMzIDE0LjUxODYgMjEuMzMzMyAxMiAyMS4zMzM1WiIgZmlsbD0iIzAwQkNGRiIvPgo8L3N2Zz4=',
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 32 }
  }
};

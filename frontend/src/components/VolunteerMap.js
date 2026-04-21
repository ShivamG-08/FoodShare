import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { getCurrentLocation, calculateDistance, DEFAULT_LOCATION } from '../utils/geolocation';

const libraries = ['places', 'geometry'];

const VolunteerMap = ({ donations, users, onLocationUpdate }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg',
    libraries
  });

  const [map, setMap] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [directions, setDirections] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_LOCATION);
  const [selectedDonation, setSelectedDonation] = useState(null);

  // Create marker icons dynamically
  const createMarkerIcon = (color) => {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  };

  // Filter and prepare markers
  const donorMarkers = donations
    .filter(donation => donation.latitude && donation.longitude)
    .map(donation => ({
      id: donation._id,
      position: { lat: donation.latitude, lng: donation.longitude },
      title: donation.food,
      type: 'donor',
      info: {
        food: donation.food,
        quantity: donation.quantity,
        location: donation.location,
        status: donation.status,
        donor: donation.donor?.name || 'Unknown Donor'
      }
    }));

  const receiverMarkers = users
    .filter(user => user.role === 'receiver' && user.latitude && user.longitude)
    .map(user => ({
      id: user._id,
      position: { lat: user.latitude, lng: user.longitude },
      title: user.name,
      type: 'receiver',
      info: {
        name: user.name,
        email: user.email,
        location: user.location || 'Unknown Location'
      }
    }));

  const allMarkers = [...donorMarkers, ...receiverMarkers];

  // Get user's current location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        setMapCenter({ lat: location.latitude, lng: location.longitude });
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
        console.log('User location found:', location);
      } catch (error) {
        console.error('Error getting user location:', error);
        // Default to Mumbai if location access is denied
        setMapCenter(DEFAULT_LOCATION);
        console.log('Using default location:', DEFAULT_LOCATION);
      }
    };

    getUserLocation();
  }, [onLocationUpdate]);

  // Debug data
  useEffect(() => {
    console.log('Donations:', donations);
    console.log('Users:', users);
    console.log('Donor markers:', donorMarkers);
    console.log('Receiver markers:', receiverMarkers);
  }, [donations, users, donorMarkers, receiverMarkers]);

  // Handle map load
  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  // Handle marker click
  const onMarkerClick = useCallback((marker) => {
    setSelectedMarker(marker);
    setSelectedDonation(marker.info);
  }, []);

  // Close info window
  const onInfoWindowClose = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  // Show directions between donor and receiver
  const showDirections = useCallback((donor, receiver) => {
    if (!map) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: { lat: donor.latitude, lng: donor.longitude },
        destination: { lat: receiver.latitude, lng: receiver.longitude },
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  }, [map]);

  // Calculate distance between two points
  const getDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return null;
    return calculateDistance(
      point1.lat, point1.lng,
      point2.lat, point2.lng
    );
  }, []);

  if (loadError) {
    return (
      <div style={{ 
        height: '400px', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ color: '#dc3545', fontSize: '16px' }}>Failed to load map</div>
        <div style={{ color: '#6c757d', fontSize: '14px' }}>Please check your internet connection</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ 
        height: '400px', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div>Loading map...</div>
      </div>
    );
  }

  return (
    <div style={{ height: '400px', width: '100%', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: '100%'
        }}
        center={mapCenter}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true
        }}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }}
            title="Your Location"
          />
        )}

        {/* Donor markers */}
        {donorMarkers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createMarkerIcon('#4CAF50')}
            title={marker.title}
            onClick={() => onMarkerClick(marker)}
          />
        ))}

        {/* Receiver markers */}
        {receiverMarkers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createMarkerIcon('#2196F3')}
            title={marker.title}
            onClick={() => onMarkerClick(marker)}
          />
        ))}

        {/* Info window for selected marker */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={onInfoWindowClose}
          >
            <div style={{ padding: '10px', maxWidth: '250px' }}>
              {selectedMarker.type === 'donor' ? (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#4CAF50' }}>
                    🍽 {selectedMarker.info.food}
                  </h4>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Quantity:</strong> {selectedMarker.info.quantity}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Location:</strong> {selectedMarker.info.location}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Status:</strong> 
                    <span style={{ 
                      color: selectedMarker.info.status === 'pending' ? '#ff9800' : 
                             selectedMarker.info.status === 'assigned' ? '#2196F3' : '#4CAF50' 
                    }}>
                      {selectedMarker.info.status}
                    </span>
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Donor:</strong> {selectedMarker.info.donor}
                  </p>
                  {userLocation && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Distance:</strong> {getDistance(userLocation, selectedMarker.position)?.toFixed(2)} km
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#2196F3' }}>
                    👤 {selectedMarker.info.name}
                  </h4>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Email:</strong> {selectedMarker.info.email}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Location:</strong> {selectedMarker.info.location}
                  </p>
                  {userLocation && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Distance:</strong> {getDistance(userLocation, selectedMarker.position)?.toFixed(2)} km
                    </p>
                  )}
                </div>
              )}
            </div>
          </InfoWindow>
        )}

        {/* Directions renderer */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: 4
              }
            }}
          />
        )}
      </GoogleMap>

      {/* Map controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
          📍 Map Legend
        </div>
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          <div style={{ marginBottom: '4px' }}>
            🟢 Donor Location
          </div>
          <div style={{ marginBottom: '4px' }}>
            🔵 Receiver Location
          </div>
          <div style={{ marginBottom: '4px' }}>
            🔵 Your Location
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerMap;

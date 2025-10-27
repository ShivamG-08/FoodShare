import React, { useMemo } from "react";
import { LoadScript, GoogleMap, Marker, Circle, Autocomplete } from "@react-google-maps/api";

// Map.js - Simple reusable Google Map component
// Reads API key from process.env.REACT_APP_GOOGLE_MAPS_API_KEY
// Make sure to copy frontend/.env.example to frontend/.env and restart dev server.

const containerStyle = { width: "100%", height: 420, borderRadius: 8 };

const donorMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#D1D5DB" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#A78BFA" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#064E3B" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0EA5E9" }] },
];

const receiverMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f3f4f6" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d1fae5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#d1d5db" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#93c5fd" }] },
];

const makeSvgPin = (hex = "#ef4444") => ({
  path: "M12 2C7.03 2 3 6.03 3 11c0 6.08 7.65 10.54 8 10.73.35-.19 8-4.65 8-10.73 0-4.97-4.03-9-9-9zm0 12.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z",
  fillColor: hex,
  fillOpacity: 1,
  strokeWeight: 1,
  strokeColor: "#111827",
  scale: 1.6,
  anchor: { x: 12, y: 22 },
});

function Map({
  title = "Map",
  role = "donor", // 'donor' | 'receiver'
  center = { lat: 19.076, lng: 72.8777 },
  zoom = 12,
  markers = [], // [{ id, position: {lat,lng}, label, color }]
  radiusKm = 0, // 0 disables circle
  showSearch = true,
}) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const mapId = undefined; // optional: if you use a custom Map ID from Google Cloud
  const styles = useMemo(() => (role === "receiver" ? receiverMapStyle : donorMapStyle), [role]);

  if (!apiKey) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p>
          Missing Google Maps API key. Copy <code>frontend/.env.example</code> to <code>frontend/.env</code> and set:
        </p>
        <pre style={{ background: "#111827", color: "#e5e7eb", padding: 12, borderRadius: 8 }}>
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
        </pre>
        <p>Then restart the dev server.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {showSearch && (
          <Autocomplete onPlaceChanged={() => {}}>
            <input
              type="text"
              placeholder="Search locality, city, area"
              style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, minWidth: 220 }}
            />
          </Autocomplete>
        )}
      </div>

      <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          options={{
            styles,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            mapId,
          }}
        >
          {markers.map((m) => (
            <Marker
              key={m.id || `${m.position.lat},${m.position.lng}`}
              position={m.position}
              title={m.label || ""}
              icon={makeSvgPin(m.color || (role === "receiver" ? "#10b981" : "#f59e0b"))}
            />
          ))}

          {radiusKm > 0 && center && (
            <Circle
              center={center}
              radius={radiusKm * 1000}
              options={{
                strokeColor: "#3b82f6",
                strokeOpacity: 0.6,
                strokeWeight: 1,
                fillColor: "#3b82f6",
                fillOpacity: 0.12,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

export default Map;

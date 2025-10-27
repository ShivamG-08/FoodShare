import React, { useEffect, useMemo, useRef, useState } from "react";

// Simple, dependency-free Google Maps loader + interactive map section
// Requires .env entry: REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY

const loadGoogleMaps = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }
    const existing = document.getElementById("google-maps-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const donorMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#D1D5DB" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#A78BFA" }],
  },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#064E3B" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#374151" }],
  },
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

const MapSection = ({
  title = "Map",
  role = "donor", // 'donor' | 'receiver'
  center = { lat: 19.076, lng: 72.8777 },
  markers = [], // [{ id, position: {lat,lng}, label, color }]
  initialRadiusKm = 5,
  autoGeolocate = false, // if true, attempts geolocation on mount
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const searchInputRef = useRef(null);
  const placeMarkerRef = useRef(null);
  const [radiusKm, setRadiusKm] = useState(initialRadiusKm);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const mapStyle = useMemo(() => (role === "receiver" ? receiverMapStyle : donorMapStyle), [role]);

  useEffect(() => {
    if (!apiKey) return; // render fallback UI
    let mounted = true;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!mounted || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center,
          zoom: 12,
          styles: mapStyle,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        mapRef.current = map;

        // Add provided markers with custom pins
        markers.forEach((m) => {
          const marker = new maps.Marker({
            position: m.position,
            map,
            title: m.label || "",
            icon: makeSvgPin(m.color || (role === "receiver" ? "#10b981" : "#f59e0b")),
          });
          if (m.label) {
            const info = new maps.InfoWindow({ content: `<div style='font-size:14px'>${m.label}</div>` });
            marker.addListener("click", () => info.open({ map, anchor: marker }));
          }
        });

        // Try geolocate user and show a distinct pin + radius (only if explicitly enabled)
        if (autoGeolocate && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              map.setCenter(p);
              userMarkerRef.current = new maps.Marker({
                position: p,
                map,
                title: "You are here",
                icon: makeSvgPin("#3b82f6"),
                zIndex: 999,
              });
              radiusCircleRef.current = new maps.Circle({
                strokeColor: "#3b82f6",
                strokeOpacity: 0.6,
                strokeWeight: 1,
                fillColor: "#3b82f6",
                fillOpacity: 0.12,
                map,
                center: p,
                radius: radiusKm * 1000,
              });
            },
            () => {}
          );
        }

        // Places Autocomplete for locality search
        if (searchInputRef.current) {
          const autocomplete = new maps.places.Autocomplete(searchInputRef.current, {
            types: ["(cities)"],
            fields: ["geometry", "name"],
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place || !place.geometry || !place.geometry.location) return;
            const loc = place.geometry.location;
            map.panTo(loc);
            map.setZoom(13);
            if (placeMarkerRef.current) placeMarkerRef.current.setMap(null);
            placeMarkerRef.current = new maps.Marker({
              position: loc,
              map,
              title: place.name,
              icon: makeSvgPin(role === "receiver" ? "#10b981" : "#f59e0b"),
            });
          });
        }
      })
      .catch((e) => {
        console.error("Google Maps load failed", e);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Update radius in circle when slider changes
  useEffect(() => {
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setRadius(radiusKm * 1000);
    }
  }, [radiusKm]);

  if (!apiKey) {
    return (
      <div style={{ padding: 16 }} className="card">
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p>To enable the interactive map, set your API key in a .env file at the project root:</p>
        <pre style={{ background: "#111827", color: "#e5e7eb", padding: 12, borderRadius: 8 }}>
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
        </pre>
        <p>After adding the key, restart the dev server.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search locality, city, area"
            style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, minWidth: 220 }}
          />
          <button
            type="button"
            onClick={() => {
              if (!mapRef.current || !navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition((pos) => {
                const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                mapRef.current.setCenter(p);
                mapRef.current.setZoom(14);
              });
            }}
            style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff" }}
          >
            Use my location
          </button>
          <label style={{ fontSize: 14 }}>Radius: {radiusKm} km</label>
          <input
            type="range"
            min={1}
            max={25}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
        </div>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: 420 }} />
      <div style={{ padding: 12, fontSize: 13, color: "#6b7280" }}>
        Tip: {role === "receiver" ? "Explore donations around your current location." : "Share your pickup-friendly radius and track nearby receivers."}
      </div>
    </div>
  );
};

export default MapSection;

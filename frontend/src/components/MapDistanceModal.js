import React from "react";

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  width: "90%",
  maxWidth: 900,
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const bodyStyle = {
  width: "100%",
  height: 520,
};

const footerStyle = {
  padding: "12px 16px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

function buildEmbedUrl(origin, destination) {
  // Uses non-key Google Maps embed via query; works for address strings
  const saddr = encodeURIComponent(origin || "");
  const daddr = encodeURIComponent(destination || "");
  return `https://www.google.com/maps?output=embed&saddr=${saddr}&daddr=${daddr}`;
}

const MapDistanceModal = ({ open, onClose, origin, destination, title = "Map" }) => {
  if (!open) return null;
  const src = buildEmbedUrl(origin, destination);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div style={bodyStyle}>
          <iframe
            title="Directions"
            src={src}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            allowFullScreen
          />
        </div>
        <div style={footerStyle}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default MapDistanceModal;

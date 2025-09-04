import React, { useState } from "react";
import axios from "axios";

// Styling
const containerStyle = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: 'Arial, sans-serif'
};

const formStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginBottom: '20px'
};

const inputGroup = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '15px'
};

const labelStyle = {
  marginBottom: '5px',
  fontWeight: 'bold'
};

const inputStyle = {
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '16px'
};

const buttonStyle = {
  padding: '12px 24px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
  marginTop: '10px',
  width: '200px'
};

const resultStyle = {
  marginTop: '20px',
  padding: '15px',
  borderRadius: '4px',
  backgroundColor: '#f8f9fa',
  borderLeft: '5px solid #4CAF50'
};

const foodTypes = ["fruit", "vegetable", "meat", "dairy", "bakery", "cooked_food"];
const packagingTypes = ["none", "plastic", "glass", "metal", "paper"];

function DonorDashboard() {
  const [foodData, setFoodData] = useState({
    food_type: "fruit",
    food_name: "",
    cuisine: "universal",
    time_since_cooked_hours: 0,
    storage_temp_c: 4,
    humidity: 0.5,
    packaging: "none",
    previous_reheats: 0,
    ph_level: 7.0,
    smell_score: 5,
  });
  
  const [prediction, setPrediction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFoodData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:5000/predict", foodData);
      setPrediction(response.data.prediction);
    } catch (err) {
      setError("Failed to get prediction. Please try again.");
      console.error("Prediction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Food Freshness Predictor</h2>
      <p>Fill in the details below to check if your food is still good to eat.</p>
      
      <form onSubmit={handlePredict} style={formStyle}>
        <div style={inputGroup}>
          <label style={labelStyle}>Food Type *</label>
          <select 
            name="food_type" 
            value={foodData.food_type}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            {foodTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Food Name *</label>
          <input
            type="text"
            name="food_name"
            value={foodData.food_name}
            onChange={handleChange}
            style={inputStyle}
            required
            placeholder="e.g., Apple, Chicken Curry"
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Time Since Cooked (hours) *</label>
          <input
            type="number"
            name="time_since_cooked_hours"
            value={foodData.time_since_cooked_hours}
            onChange={handleChange}
            min="0"
            step="0.5"
            style={inputStyle}
            required
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Storage Temperature (°C) *</label>
          <input
            type="number"
            name="storage_temp_c"
            value={foodData.storage_temp_c}
            onChange={handleChange}
            min="-20"
            max="40"
            step="0.1"
            style={inputStyle}
            required
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Humidity (0-1) *</label>
          <input
            type="number"
            name="humidity"
            value={foodData.humidity}
            onChange={handleChange}
            min="0"
            max="1"
            step="0.01"
            style={inputStyle}
            required
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Packaging *</label>
          <select 
            name="packaging" 
            value={foodData.packaging}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            {packagingTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Number of Times Reheated *</label>
          <input
            type="number"
            name="previous_reheats"
            value={foodData.previous_reheats}
            onChange={handleChange}
            min="0"
            style={inputStyle}
            required
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>pH Level (0-14) *</label>
          <input
            type="number"
            name="ph_level"
            value={foodData.ph_level}
            onChange={handleChange}
            min="0"
            max="14"
            step="0.1"
            style={inputStyle}
            required
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>Smell Score (1-10) *</label>
          <input
            type="number"
            name="smell_score"
            value={foodData.smell_score}
            onChange={handleChange}
            min="1"
            max="10"
            style={inputStyle}
            required
          />
        </div>

        <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
          <button 
            type="submit" 
            style={buttonStyle}
            disabled={isLoading}
          >
            {isLoading ? 'Predicting...' : 'Check Food Freshness'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ ...resultStyle, borderLeftColor: '#f44336' }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {prediction && (
        <div style={resultStyle}>
          <h3>Prediction Result</h3>
          <p>
            <strong>Food:</strong> {foodData.food_name}<br />
            <strong>Status:</strong> {prediction === 'fresh' ? '✅ Safe to eat' : '❌ Not safe to eat'}
          </p>
          {prediction === 'fresh' ? (
            <p>This food appears to be fresh and safe for donation.</p>
          ) : (
            <p>This food may not be safe for donation. Please consider proper disposal.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default DonorDashboard;

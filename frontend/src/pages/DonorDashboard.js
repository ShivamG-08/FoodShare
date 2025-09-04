import React, { useState } from "react";
import axios from "axios";
import "./DonorDashboard.css"; // ✅ import CSS file

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
    <div className="donor-container">
      <h2>Food Freshness Predictor</h2>
      <p>Fill in the details below to check if your food is still good to eat.</p>

      <form onSubmit={handlePredict} className="donor-form">
        <div className="input-group">
          <label>Food Type *</label>
          <select name="food_type" value={foodData.food_type} onChange={handleChange} required>
            {foodTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Food Name *</label>
          <input type="text" name="food_name" value={foodData.food_name} onChange={handleChange} required placeholder="e.g., Apple, Chicken Curry" />
        </div>

        <div className="input-group">
          <label>Time Since Cooked (hours) *</label>
          <input type="number" name="time_since_cooked_hours" value={foodData.time_since_cooked_hours} onChange={handleChange} min="0" step="0.5" required />
        </div>

        <div className="input-group">
          <label>Storage Temperature (°C) *</label>
          <input type="number" name="storage_temp_c" value={foodData.storage_temp_c} onChange={handleChange} min="-20" max="40" step="0.1" required />
        </div>

        <div className="input-group">
          <label>Humidity (0-1) *</label>
          <input type="number" name="humidity" value={foodData.humidity} onChange={handleChange} min="0" max="1" step="0.01" required />
        </div>

        <div className="input-group">
          <label>Packaging *</label>
          <select name="packaging" value={foodData.packaging} onChange={handleChange} required>
            {packagingTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Number of Times Reheated *</label>
          <input type="number" name="previous_reheats" value={foodData.previous_reheats} onChange={handleChange} min="0" required />
        </div>

        <div className="input-group">
          <label>pH Level (0-14) *</label>
          <input type="number" name="ph_level" value={foodData.ph_level} onChange={handleChange} min="0" max="14" step="0.1" required />
        </div>

        <div className="input-group">
          <label>Smell Score (1-10) *</label>
          <input type="number" name="smell_score" value={foodData.smell_score} onChange={handleChange} min="1" max="10" required />
        </div>

        <div className="button-container">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Predicting...' : 'Check Food Freshness'}
          </button>
        </div>
      </form>

      {error && (
        <div className="result error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {prediction && (
        <div className="result">
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

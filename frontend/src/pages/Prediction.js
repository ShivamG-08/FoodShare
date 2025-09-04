import React, { useState } from "react";

export default function Prediction() {
  const [inputData, setInputData] = useState({});
  const [result, setResult] = useState("");

  const handleChange = (e) => {
    setInputData({ ...inputData, [e.target.name]: e.target.value });
  };

  const handlePredict = async () => {
    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });

      const data = await res.json();
      setResult(data.prediction || "Error");
    } catch (err) {
      setResult("Prediction failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-100">
      <h1 className="text-3xl font-bold mb-4">Predict Food Condition</h1>
      <input
        name="feature1"
        placeholder="Enter feature 1"
        onChange={handleChange}
        className="mb-2 p-2 border rounded"
      />
      <input
        name="feature2"
        placeholder="Enter feature 2"
        onChange={handleChange}
        className="mb-2 p-2 border rounded"
      />
      {/* add more inputs depending on your model features */}

      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={handlePredict}
      >
        Predict
      </button>

      {result && <p className="mt-4 text-lg text-red-600">Result: {result}</p>}
    </div>
  );
}

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(files);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only image files (JPEG, PNG, GIF) are allowed for profile pictures');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture size must be less than 5MB');
        return;
      }
      setProfilePic(file);
      setError('');
    }
  };

  const uploadDocuments = async (userId) => {
    if (documents.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      documents.forEach(file => {
        formData.append('documents', file);
      });
      
      const response = await axios.post(
        `http://localhost:5000/api/users/${userId}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      console.log('Documents uploaded successfully:', response.data);
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate documents for non-admin users
    if (formData.role !== 'admin' && documents.length === 0) {
      setError("Documents are required for account verification");
      setIsLoading(false);
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('email', formData.email);
      submitFormData.append('password', formData.password);
      submitFormData.append('role', formData.role);
      
      if (profilePic) {
        submitFormData.append('profilePic', profilePic);
      }

      const response = await axios.post("http://localhost:5000/api/auth/signup", submitFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.message === "User registered successfully") {
        const userId = response.data.user.id;
        
        // Upload documents if any
        if (documents.length > 0) {
          await uploadDocuments(userId);
        }
        
        const statusMessage = formData.role === 'admin' 
          ? `Admin account created! You can now login.`
          : formData.role === 'admin' || formData.role === 'volunteer'
          ? `Signup successful! Your account is pending approval. You'll be notified once approved.`
          : `Signup successful! You are registered as a ${formData.role}.`;
          
        alert(statusMessage);
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error signing up. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create an Account</h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength="6"
        />

        <label>I want to:</label>
        <select name="role" value={formData.role} onChange={handleChange} required>
          <option value="donor">Donate Food</option>
          <option value="receiver">Receive Food</option>
          <option value="volunteer">Volunteer for Delivery</option>
        </select>

        <div className="profile-pic-upload">
          <label>Profile Picture (Optional)</label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleProfilePicChange}
          />
          {profilePic && (
            <div className="profile-pic-preview">
              <p>Selected profile picture:</p>
              <img 
                src={URL.createObjectURL(profilePic)} 
                alt="Profile preview" 
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
              />
              <button 
                type="button" 
                onClick={() => setProfilePic(null)}
                style={{ marginLeft: '10px', padding: '5px 10px' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {formData.role !== 'admin' && (
          <div className="document-upload">
            <label>Upload Verification Documents (ID, Certificate, etc.) <span className="required-star">*</span></label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              required
            />
            {documents.length > 0 && (
              <div className="selected-files">
                <p>Selected files:</p>
                {documents.map((file, index) => (
                  <span key={index} className="file-name">{file.name}</span>
                ))}
              </div>
            )}
            <p className="document-required">Documents are required for account verification</p>
          </div>
        )}

        <button type="submit" disabled={isLoading || uploading}>
          {isLoading || uploading ? "Processing..." : "Sign Up"}
        </button>
      </form>

      <p>
        Already have an account?{" "}
        <a href="/login" className="login-link">
          Login here
        </a>
      </p>
    </div>
  );
}

export default Signup;

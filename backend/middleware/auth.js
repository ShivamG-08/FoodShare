const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    try {
      // Get user from database
      const user = await User.findById(decoded.id).select('id email role status');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Server error during authentication' });
    }
  });
};

module.exports = { authenticateToken };

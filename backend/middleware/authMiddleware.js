const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT and attaches the logged-in user to req.user
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (req.user.status === 'suspended') {
        return res.status(403).json({ message: 'Account has been suspended by an administrator' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Usage: authorize('admin') or authorize('donor', 'admin')
// Restricts a route to specific roles. Must run AFTER protect.
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user?.role}' is not authorized for this action` });
    }
    return next();
  };
};

module.exports = { protect, authorize };

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  let decoded;
  try {
    const token = authorization.slice("Bearer ".length);
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }

  req.user = await User.findById(decoded.id).select("-password");
  if (!req.user) {
    return res.status(401).json({ message: "User not found" });
  }

  return next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized for this action" });
    }
    return next();
  };
};

module.exports = { protect, authorize };

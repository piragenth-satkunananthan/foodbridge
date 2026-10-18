const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../config/generateToken');

const publicRoles = ['donor', 'recipient', 'volunteer', 'recycler'];

// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, district, contactNumber } = req.body;

    if (!name || !email || !password || !role || !district || !contactNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!publicRoles.includes(role)) {
      return res.status(400).json({ message: 'This role cannot be registered publicly' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      district,
      contactNumber
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      district: user.district,
      verificationStatus: user.verificationStatus,
      status: user.status,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account has been suspended by an administrator' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      district: user.district,
      verificationStatus: user.verificationStatus,
      status: user.status,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  // req.user is set by the protect middleware
  res.json(req.user);
};

module.exports = { registerUser, loginUser, getMe };

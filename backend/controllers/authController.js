const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../config/generateToken');

const { district: normalizeDistrict } = require('../utils/domain');

const publicRoles = ['donor', 'recipient', 'volunteer', 'recycler'];

// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, district, contactNumber } = req.body;

    if (!name || !email || !password || !role || !district || !contactNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!publicRoles.includes(role)) {
      return res
        .status(400)
        .json({ message: 'This role cannot be registered publicly' });
    }

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    )
      return res
        .status(400)
        .json({ message: 'Valid email and password are required' });
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.length > 200 ||
      typeof contactNumber !== 'string' ||
      !contactNumber.trim() ||
      contactNumber.length > 50 ||
      password.length < 8 ||
      Buffer.byteLength(password) > 72
    )
      return res.status(400).json({
        message:
          'Invalid profile or password (8 characters minimum, 72 bytes maximum)'
      });
    const validDistrict = normalizeDistrict(district);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      district: validDistrict,
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
    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'Unable to complete authentication request'
    });
  }
};

// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    )
      return res
        .status(400)
        .json({ message: 'Valid email and password are required' });
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
      return res
        .status(403)
        .json({ message: 'Account has been suspended by an administrator' });
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
    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'Unable to complete authentication request'
    });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  // req.user is set by the protect middleware
  res.json(req.user);
};

module.exports = { registerUser, loginUser, getMe };

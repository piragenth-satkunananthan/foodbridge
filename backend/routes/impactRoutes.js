const express = require('express');
const router = express.Router();
const { getPublicImpact } = require('../controllers/impactController');

// Public route - anyone can see community impact without logging in
router.get('/', getPublicImpact);

module.exports = router;

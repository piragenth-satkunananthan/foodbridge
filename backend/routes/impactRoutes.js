const express = require('express');
const router = express.Router();
const {
  getPublicImpact,
  getLiveFeed,
  getDistrictStats
} = require('../controllers/impactController');

// Public routes - accessible without authentication
router.get('/', getPublicImpact);
router.get('/live-feed', getLiveFeed);
router.get('/district-stats', getDistrictStats);

module.exports = router;

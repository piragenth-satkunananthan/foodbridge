const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// TODO (Module 2 - District-Based & Smart Matching): build these out
// router.get('/nearby-donations', protect, authorize('recipient'), getNearbyDonations);
// router.post('/:donationId/request', protect, authorize('recipient'), requestDonation);
// router.put('/:donationId/accept', protect, authorize('recipient'), acceptDonation);

router.get('/', (req, res) => {
  res.json({ message: 'Matching routes placeholder - build me out!' });
});

module.exports = router;

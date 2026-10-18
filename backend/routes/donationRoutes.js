const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createDonation } = require('../controllers/donationController');

// Module 1 - Donor & Surplus Posting
router.post('/', protect, authorize('donor'), createDonation);

// TODO (Module 1 - Donor & Surplus Posting): build these out
// router.get('/', protect, getDonations);
// router.get('/:id', protect, getDonationById);
// router.put('/:id', protect, authorize('donor'), updateDonation);
// router.delete('/:id', protect, authorize('donor'), cancelDonation);

router.get('/', protect, (req, res) => {
  res.json({ message: 'Donation routes placeholder - build me out!' });
});

module.exports = router;

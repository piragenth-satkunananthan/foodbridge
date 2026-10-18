const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  cancelDonation,
  getDonorStats
} = require('../controllers/donationController');

// All donation routes require authentication
router.use(protect);

// Donor stats overview
router.get('/stats', getDonorStats);

// Donation CRUD operations
router.post('/', authorize('donor'), createDonation);
router.get('/', getDonations);
router.get('/:id', getDonationById);
router.put('/:id', authorize('donor'), updateDonation);
router.delete('/:id', authorize('donor'), cancelDonation);
router.put('/:id/cancel', authorize('donor'), cancelDonation);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getNearbyDonations,
  getRecipientStats,
  claimDonation,
  cancelDonationClaim,
  getMyClaims,
  rankRecipientsForDonation
} = require('../controllers/matchController');

// Proximity-Based Smart Matching & Charity Allocation Pipeline (Module 2)

// @route   GET /api/match/nearby-donations
// @desc    Get available surplus food ranked by proximity & smart match score
// @access  Private (Recipient, Admin)
router.get('/nearby-donations', protect, authorize('recipient', 'admin'), getNearbyDonations);

// @route   GET /api/match/stats
// @desc    Get allocation and rescue statistics for recipient
// @access  Private (Recipient, Admin)
router.get('/stats', protect, authorize('recipient', 'admin'), getRecipientStats);

// @route   GET /api/match/my-claims
// @desc    Get claims made by recipient organization
// @access  Private (Recipient, Admin)
router.get('/my-claims', protect, authorize('recipient', 'admin'), getMyClaims);

// @route   POST /api/match/:donationId/claim
// @desc    Claim a surplus donation for rescue
// @access  Private (Recipient, Admin)
router.post('/:donationId/claim', protect, authorize('recipient', 'admin'), claimDonation);

// @route   PUT /api/match/:donationId/cancel-claim
// @desc    Cancel an active claim before volunteer pickup
// @access  Private (Recipient, Admin)
router.put('/:donationId/cancel-claim', protect, authorize('recipient', 'admin'), cancelDonationClaim);

// @route   GET /api/match/recipients-for-donation/:donationId
// @desc    Suggest and rank nearby verified recipients for a specific donation
// @access  Private (Donor, Admin, Recipient)
router.get('/recipients-for-donation/:donationId', protect, rankRecipientsForDonation);

module.exports = router;

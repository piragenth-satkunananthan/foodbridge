const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getOpenPickupJobs,
  getMyActiveJobs,
  getPickupHistory,
  getVolunteerStats,
  getPickupById,
  acceptPickupJob,
  updatePickupStatus,
  cancelPickupJob,
  updatePickupLocation
} = require('../controllers/pickupController');

// All pickup routes require authentication
router.use(protect);

// Volunteer Courier Discovery & Pipeline Routes (Module 4)

// @route   GET /api/pickups/open
// @desc    Get nearby unassigned jobs available for courier pickup
// @access  Private (Volunteer, Admin)
router.get('/open', authorize('volunteer', 'admin'), getOpenPickupJobs);

// @route   GET /api/pickups/my-active
// @desc    Get the in-progress mission currently assigned to volunteer
// @access  Private (Volunteer, Admin)
router.get('/my-active', authorize('volunteer', 'admin'), getMyActiveJobs);

// @route   GET /api/pickups/history
// @desc    Get past completed rescue transport missions
// @access  Private (Volunteer, Admin)
router.get('/history', authorize('volunteer', 'admin'), getPickupHistory);

// @route   GET /api/pickups/stats
// @desc    Get aggregate volunteer metrics (missions, meals, km)
// @access  Private (Volunteer, Admin)
router.get('/stats', authorize('volunteer', 'admin'), getVolunteerStats);

// @route   GET /api/pickups/:id
// @desc    Get single pickup details with route telemetry
// @access  Private
router.get('/:id', getPickupById);

// @route   POST /api/pickups/:id/accept
// @desc    Volunteer accepts an open pickup assignment
// @access  Private (Volunteer, Admin)
router.post('/:id/accept', authorize('volunteer', 'admin'), acceptPickupJob);

// @route   PUT /api/pickups/:id/status
// @desc    Advance status milestone (picked_up -> delivered_or_recycled -> completed)
// @access  Private (Volunteer, Admin)
router.put('/:id/status', authorize('volunteer', 'admin'), updatePickupStatus);

// @route   PUT /api/pickups/:id/cancel
// @desc    Release accepted job back to open board
// @access  Private (Volunteer, Admin)
router.put('/:id/cancel', authorize('volunteer', 'admin'), cancelPickupJob);

// @route   PUT /api/pickups/:id/location
// @desc    Update live GPS coordinates for in-transit tracking
// @access  Private (Volunteer, Admin)
router.put('/:id/location', authorize('volunteer', 'admin'), updatePickupLocation);

module.exports = router;

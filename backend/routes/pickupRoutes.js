const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// TODO (Module 4 - Volunteer, Pickup & Route Tracking): build these out
// router.get('/open-jobs', protect, authorize('volunteer'), getOpenPickupJobs);
// router.put('/:id/accept', protect, authorize('volunteer'), acceptPickupJob);
// router.put('/:id/status', protect, authorize('volunteer'), updatePickupStatus);

router.get('/', (req, res) => {
  res.json({ message: 'Pickup routes placeholder - build me out!' });
});

module.exports = router;

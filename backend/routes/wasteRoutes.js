const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Circular Waste Stream & Industrial Recycler Routing Pipeline
// router.post('/', protect, authorize('donor'), createWasteRequest);
// router.get('/', protect, getWasteRequests);
// router.put('/:id/accept', protect, authorize('recycler'), acceptWasteRequest);

router.get('/', (req, res) => {
  res.json({ message: 'Waste request routes placeholder - build me out!' });
});

module.exports = router;

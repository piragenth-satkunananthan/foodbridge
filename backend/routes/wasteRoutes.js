const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// TODO (Module 3 - Waste Classification & Recycler): build these out
// router.post('/', protect, authorize('donor'), createWasteRequest);
// router.get('/', protect, getWasteRequests);
// router.put('/:id/accept', protect, authorize('recycler'), acceptWasteRequest);

router.get('/', (req, res) => {
  res.json({ message: 'Waste request routes placeholder - build me out!' });
});

module.exports = router;

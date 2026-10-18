const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createWasteRequest,
  getWasteRequests,
  getWasteRequestById,
  updateWasteRequest,
  cancelWasteRequest
} = require('../controllers/wasteController');

router.use(protect);

router.post('/', authorize('donor'), createWasteRequest);
router.get('/', getWasteRequests);
router.get('/:id', getWasteRequestById);
router.put('/:id', authorize('donor'), updateWasteRequest);
router.delete('/:id', authorize('donor'), cancelWasteRequest);
router.put('/:id/cancel', authorize('donor'), cancelWasteRequest);

module.exports = router;

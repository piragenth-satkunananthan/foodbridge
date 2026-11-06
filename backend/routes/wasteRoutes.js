const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  classifyWaste,
  createWasteRequest,
  getWasteRequests,
  getWasteRequestById,
  updateWasteRequest,
  cancelWasteRequest,
  getRecyclerFeed,
  claimWasteRequest,
  cancelWasteClaim,
  getRecyclerClaims,
  confirmWasteRecycled,
  getRecyclerStats,
  getEligibleCollectorsForWaste,
  getWasteCertificate
} = require('../controllers/wasteController');

// All waste routes require authentication
router.use(protect);

// ==========================================================
// Smart Waste Classification & Category Routing (Module 3)
// ==========================================================
router.post('/classify', classifyWaste);

// ==========================================================
// Recycler Hub & Collector Operational Pipeline (Module 3)
// ==========================================================
router.get('/recycler/feed', authorize('recycler', 'admin'), getRecyclerFeed);
router.get('/recycler/claims', authorize('recycler', 'admin'), getRecyclerClaims);
router.get('/recycler/stats', authorize('recycler', 'admin'), getRecyclerStats);

router.post('/:id/claim', authorize('recycler', 'admin'), claimWasteRequest);
router.put('/:id/cancel-claim', authorize('recycler', 'admin'), cancelWasteClaim);
router.put('/:id/confirm-recycled', authorize('recycler', 'admin'), confirmWasteRecycled);
router.get('/:id/certificate', getWasteCertificate);
router.get('/:id/collectors', getEligibleCollectorsForWaste);

// ==========================================================
// Commercial Donor Surplus Waste Posting & Management
// ==========================================================
router.post('/', authorize('donor'), createWasteRequest);
router.get('/', getWasteRequests);
router.get('/:id', getWasteRequestById);
router.put('/:id', authorize('donor'), updateWasteRequest);
router.delete('/:id', authorize('donor'), cancelWasteRequest);
router.put('/:id/cancel', authorize('donor'), cancelWasteRequest);

module.exports = router;

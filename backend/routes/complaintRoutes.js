const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createComplaint,
  getComplaints,
  resolveComplaint
} = require('../controllers/complaintController');
router.use(protect);
router.post('/', createComplaint);
router.get('/', getComplaints);
router.put('/:id', authorize('admin'), resolveComplaint);
module.exports = router;

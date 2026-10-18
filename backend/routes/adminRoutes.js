const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getOrganizations,
  getOrganizationById,
  verifyOrganization,
  getAllDonations,
  getAllWasteRequests,
  getAllPickups,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getReports
} = require('../controllers/adminController');
const { recordMonthlySnapshot } = require('../controllers/impactController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication and the 'admin' role
router.use(protect, authorize('admin'));

// 1. Dashboard KPIs & Activity
router.get('/stats', getAdminStats);

// 2. Organization Verification
router.get('/organizations', getOrganizations);
router.get('/organizations/:id', getOrganizationById);
router.put('/organizations/:id/verify', verifyOrganization);

// 3. Platform Monitoring
router.get('/donations', getAllDonations);
router.get('/waste-requests', getAllWasteRequests);
router.get('/pickups', getAllPickups);

// 4. User & Fake Account Management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// 5. Reports & Impact Snapshot
router.get('/reports', getReports);
router.post('/impact/snapshot', recordMonthlySnapshot);

module.exports = router;

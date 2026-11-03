const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getOrganization, saveOrganization } = require('../controllers/organizationController');
router.use(protect,authorize('recipient','recycler'));
router.get('/me',getOrganization);
router.put('/me',saveOrganization);
router.post('/',saveOrganization);
module.exports = router;

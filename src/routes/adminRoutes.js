import express from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  updateDoctorApproval
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  updateUserStatusValidator,
  updateDoctorApprovalValidator
} from '../validators/adminValidators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', validate(updateUserStatusValidator), updateUserStatus);
router.patch(
  '/doctors/:id/approval',
  validate(updateDoctorApprovalValidator),
  updateDoctorApproval
);

export default router;

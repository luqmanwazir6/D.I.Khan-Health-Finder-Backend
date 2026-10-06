import express from 'express';
import {
  getDoctors,
  getMyDoctorProfile,
  getDoctorByIdOrSlug,
  getDoctorSlots,
  createDoctor,
  updateDoctor,
  deleteDoctor
} from '../controllers/doctorController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createDoctorValidator,
  updateDoctorValidator,
  slotsQueryValidator
} from '../validators/doctorValidators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Optional auth helper to populate req.user if a token was sent on public endpoints
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  return next();
};

// 1. Public List (with optional auth for admin includeInactive=true)
router.get('/', optionalAuth, getDoctors);

// 2. Doctor Own Profile - MUST BE REGISTERED BEFORE /:id
router.get(
  '/me',
  authenticate,
  authorize(ROLES.DOCTOR, ROLES.ADMIN),
  getMyDoctorProfile
);

// 3. Doctor Slots
router.get('/:id/slots', validate(slotsQueryValidator), getDoctorSlots);

// 4. Detail by ID or Slug
router.get('/:id', optionalAuth, getDoctorByIdOrSlug);

// 5. Admin Create Doctor
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createDoctorValidator),
  createDoctor
);

// 6. Update Doctor (Admin or owning Doctor)
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR),
  validate(updateDoctorValidator),
  updateDoctor
);

// 7. Delete Doctor (Admin only)
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteDoctor);

export default router;

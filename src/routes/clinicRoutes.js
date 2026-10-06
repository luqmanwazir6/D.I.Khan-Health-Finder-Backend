import express from 'express';
import {
  getClinics,
  getClinicByIdOrSlug,
  createClinic,
  updateClinic,
  deleteClinic
} from '../controllers/clinicController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createFacilityValidator,
  updateFacilityValidator
} from '../validators/facilityValidators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  return next();
};

router.get('/', optionalAuth, getClinics);
router.get('/:id', optionalAuth, getClinicByIdOrSlug);
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createFacilityValidator),
  createClinic
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(updateFacilityValidator),
  updateClinic
);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteClinic);

export default router;

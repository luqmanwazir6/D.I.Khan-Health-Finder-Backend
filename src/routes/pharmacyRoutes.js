import express from 'express';
import {
  getPharmacies,
  getPharmacyByIdOrSlug,
  createPharmacy,
  updatePharmacy,
  deletePharmacy
} from '../controllers/pharmacyController.js';
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

router.get('/', optionalAuth, getPharmacies);
router.get('/:id', optionalAuth, getPharmacyByIdOrSlug);
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createFacilityValidator),
  createPharmacy
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(updateFacilityValidator),
  updatePharmacy
);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deletePharmacy);

export default router;

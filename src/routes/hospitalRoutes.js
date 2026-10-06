import express from 'express';
import {
  getHospitals,
  getHospitalByIdOrSlug,
  createHospital,
  updateHospital,
  deleteHospital
} from '../controllers/hospitalController.js';
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

router.get('/', optionalAuth, getHospitals);
router.get('/:id', optionalAuth, getHospitalByIdOrSlug);
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createFacilityValidator),
  createHospital
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(updateFacilityValidator),
  updateHospital
);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteHospital);

export default router;

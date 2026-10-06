import express from 'express';
import {
  getLaboratories,
  getLaboratoryByIdOrSlug,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory
} from '../controllers/laboratoryController.js';
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

router.get('/', optionalAuth, getLaboratories);
router.get('/:id', optionalAuth, getLaboratoryByIdOrSlug);
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createFacilityValidator),
  createLaboratory
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(updateFacilityValidator),
  updateLaboratory
);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteLaboratory);

export default router;

import express from 'express';
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createReviewValidator,
  updateReviewValidator,
  queryReviewsValidator
} from '../validators/reviewValidators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', validate(queryReviewsValidator), getReviews);
router.post(
  '/',
  authenticate,
  authorize(ROLES.PATIENT),
  validate(createReviewValidator),
  createReview
);
router.patch(
  '/:id',
  authenticate,
  validate(updateReviewValidator),
  updateReview
);
router.delete('/:id', authenticate, deleteReview);

export default router;

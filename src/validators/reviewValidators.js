import { body, query } from 'express-validator';
import { TARGET_TYPE_LIST } from '../config/constants.js';

export const createReviewValidator = [
  body('targetType')
    .trim()
    .notEmpty()
    .withMessage('Target type is required')
    .isIn(TARGET_TYPE_LIST)
    .withMessage(`Target type must be one of: [${TARGET_TYPE_LIST.join(', ')}]`),
  body('targetId')
    .trim()
    .notEmpty()
    .withMessage('Target ID is required')
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB ObjectId'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

export const updateReviewValidator = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

export const queryReviewsValidator = [
  query('targetType')
    .notEmpty()
    .withMessage('targetType query parameter is required')
    .isIn(TARGET_TYPE_LIST)
    .withMessage(`targetType must be one of: [${TARGET_TYPE_LIST.join(', ')}]`),
  query('targetId')
    .notEmpty()
    .withMessage('targetId query parameter is required')
    .isMongoId()
    .withMessage('targetId must be a valid MongoDB ObjectId')
];

export default {
  createReviewValidator,
  updateReviewValidator,
  queryReviewsValidator
};

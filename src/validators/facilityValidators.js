import { body } from 'express-validator';

export const createFacilityValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Facility name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Facility name must be between 2 and 100 characters'),
  body('area')
    .trim()
    .notEmpty()
    .withMessage('Area is required'),
  body('phone')
    .optional()
    .trim(),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email must be valid'),
  body('is24Hours')
    .optional()
    .isBoolean()
    .withMessage('is24Hours must be a boolean'),
  body('isEmergency')
    .optional()
    .isBoolean()
    .withMessage('isEmergency must be a boolean')
];

export const updateFacilityValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Facility name must be between 2 and 100 characters'),
  body('area')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Area cannot be empty'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email must be valid'),
  body('is24Hours')
    .optional()
    .isBoolean()
    .withMessage('is24Hours must be a boolean'),
  body('isEmergency')
    .optional()
    .isBoolean()
    .withMessage('isEmergency must be a boolean')
];

export default {
  createFacilityValidator,
  updateFacilityValidator
};

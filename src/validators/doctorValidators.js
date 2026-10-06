import { body, query, param } from 'express-validator';
import { GENDERS, DAYS_OF_WEEK } from '../config/constants.js';

const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createDoctorValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Doctor name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Doctor name must be between 2 and 60 characters'),
  body('specialty')
    .trim()
    .notEmpty()
    .withMessage('Specialty is required'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a non-negative number'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience years must be a non-negative integer'),
  body('gender')
    .optional()
    .isIn(GENDERS)
    .withMessage('Gender must be "male" or "female"'),
  body('slotDurationMinutes')
    .optional()
    .isInt({ min: 5, max: 60 })
    .withMessage('Slot duration must be between 5 and 60 minutes'),
  body('availability')
    .optional()
    .isArray()
    .withMessage('Availability must be an array of schedule slots'),
  body('availability.*.day')
    .optional()
    .isIn(DAYS_OF_WEEK)
    .withMessage('Availability day must be a valid lowercase day of week'),
  body('availability.*.startTime')
    .optional()
    .matches(timeRegex)
    .withMessage('Availability start time must be in HH:mm format'),
  body('availability.*.endTime')
    .optional()
    .matches(timeRegex)
    .withMessage('Availability end time must be in HH:mm format')
];

export const updateDoctorValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Doctor name must be between 2 and 60 characters'),
  body('specialty')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Specialty cannot be empty'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a non-negative number'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience years must be a non-negative integer'),
  body('gender')
    .optional()
    .isIn(GENDERS)
    .withMessage('Gender must be "male" or "female"'),
  body('slotDurationMinutes')
    .optional()
    .isInt({ min: 5, max: 60 })
    .withMessage('Slot duration must be between 5 and 60 minutes'),
  body('availability')
    .optional()
    .isArray()
    .withMessage('Availability must be an array of schedule slots'),
  body('availability.*.day')
    .optional()
    .isIn(DAYS_OF_WEEK)
    .withMessage('Availability day must be a valid lowercase day of week'),
  body('availability.*.startTime')
    .optional()
    .matches(timeRegex)
    .withMessage('Availability start time must be in HH:mm format'),
  body('availability.*.endTime')
    .optional()
    .matches(timeRegex)
    .withMessage('Availability end time must be in HH:mm format')
];

export const slotsQueryValidator = [
  query('date')
    .notEmpty()
    .withMessage('Date query parameter is required')
    .matches(dateRegex)
    .withMessage('Date must be formatted as YYYY-MM-DD')
];

export default {
  createDoctorValidator,
  updateDoctorValidator,
  slotsQueryValidator
};

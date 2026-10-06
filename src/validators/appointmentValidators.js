import { body } from 'express-validator';
import { APPOINTMENT_STATUS_LIST } from '../config/constants.js';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const createAppointmentValidator = [
  body('doctorId')
    .trim()
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ObjectId'),
  body('date')
    .trim()
    .notEmpty()
    .withMessage('Date is required')
    .matches(dateRegex)
    .withMessage('Date must be formatted as YYYY-MM-DD'),
  body('startTime')
    .trim()
    .notEmpty()
    .withMessage('Start time is required')
    .matches(timeRegex)
    .withMessage('Start time must be formatted as HH:mm'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

export const updateAppointmentStatusValidator = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(APPOINTMENT_STATUS_LIST)
    .withMessage(
      `Status must be one of: [${APPOINTMENT_STATUS_LIST.join(', ')}]`
    ),
  body('note')
    .optional()
    .trim()
    .isString()
    .withMessage('Note must be a string')
];

export default {
  createAppointmentValidator,
  updateAppointmentStatusValidator
};

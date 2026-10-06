import { body } from 'express-validator';
import { DOCTOR_APPROVAL_STATUS } from '../config/constants.js';

export const updateUserStatusValidator = [
  body('isActive')
    .notEmpty()
    .withMessage('isActive field is required')
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const updateDoctorApprovalValidator = [
  body('approvalStatus')
    .trim()
    .notEmpty()
    .withMessage('approvalStatus is required')
    .isIn([DOCTOR_APPROVAL_STATUS.APPROVED, DOCTOR_APPROVAL_STATUS.REJECTED])
    .withMessage('approvalStatus must be either "approved" or "rejected"'),
  body('reason')
    .optional()
    .trim()
    .isString()
    .withMessage('Reason must be a string')
];

export default {
  updateUserStatusValidator,
  updateDoctorApprovalValidator
};

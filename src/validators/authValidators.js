import { body } from 'express-validator';
import { ROLES } from '../config/constants.js';

// Regex for Pakistani mobile numbers: 03XXXXXXXXX or +923XXXXXXXXX
const pakistaniPhoneRegex = /^(?:\+92|0092|0)?3\d{9}$/;
// Password regex: min 8 characters, at least one letter and one number
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&#^()_+\-=[\]{}|;:,.<>/~`]{8,}$/;

export const signupValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email is invalid')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(pakistaniPhoneRegex)
    .withMessage('Phone must be a valid Pakistani mobile number (e.g., 03XXXXXXXXX or +923XXXXXXXXX)'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(passwordRegex)
    .withMessage('Password must contain at least one letter and one number'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .custom((val) => {
      if (val === ROLES.ADMIN) {
        throw new Error('Admin registration is not permitted via public signup');
      }
      if (![ROLES.PATIENT, ROLES.DOCTOR].includes(val)) {
        throw new Error('Role must be either "patient" or "doctor"');
      }
      return true;
    }),
  body('specialty')
    .if(body('role').equals(ROLES.DOCTOR))
    .trim()
    .notEmpty()
    .withMessage('Specialty is required when registering as a doctor')
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email is invalid')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const updateMeValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(pakistaniPhoneRegex)
    .withMessage('Phone must be a valid Pakistani mobile number'),
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar must be a valid string URL or path')
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(passwordRegex)
    .withMessage('New password must contain at least one letter and one number')
];

export default {
  signupValidator,
  loginValidator,
  updateMeValidator,
  changePasswordValidator
};

import express from 'express';
import {
  signup,
  login,
  getMe,
  updateMe,
  changePassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import {
  signupValidator,
  loginValidator,
  updateMeValidator,
  changePasswordValidator
} from '../validators/authValidators.js';

const router = express.Router();

router.post('/signup', authLimiter, validate(signupValidator), signup);
router.post('/login', authLimiter, validate(loginValidator), login);

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(updateMeValidator), updateMe);
router.patch('/change-password', authenticate, validate(changePasswordValidator), changePassword);

export default router;

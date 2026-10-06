import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../services/tokenService.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import { HTTP_STATUS, ROLES, DOCTOR_APPROVAL_STATUS } from '../config/constants.js';

/**
 * @desc    Register a new patient or doctor account
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
export const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, specialty } = req.body;

  // 1. Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists');
  }

  // 2. Create User account
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role
  });

  // 3. If role is doctor, automatically create initial Doctor profile
  if (role === ROLES.DOCTOR) {
    const slug = await generateUniqueSlug(Doctor, name);
    await Doctor.create({
      userId: user._id,
      name,
      slug,
      specialty,
      phone,
      email,
      approvalStatus: DOCTOR_APPROVAL_STATUS.PENDING,
      isVerified: false,
      isActive: true
    });
  }

  // 4. Generate JWT Token
  const token = generateToken({ id: user.id, role: user.role });

  return sendSuccess(
    res,
    HTTP_STATUS.CREATED,
    'Account registered successfully',
    {
      user: user.toJSON(),
      token
    }
  );
});

/**
 * @desc    Authenticate user & return JWT token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Retrieve user with password included
  const user = await User.findOne({ email }).select('+password');

  // Generic security message for both unknown user and bad password
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check active state
  if (!user.isActive) {
    throw ApiError.forbidden(
      'Your account has been deactivated. Please contact support.'
    );
  }

  const token = generateToken({ id: user.id, role: user.role });

  return sendSuccess(res, HTTP_STATUS.OK, 'Login successful', {
    user: user.toJSON(),
    token
  });
});

/**
 * @desc    Get currently authenticated user details
 * @route   GET /api/v1/auth/me
 * @access  Private (auth)
 */
export const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, HTTP_STATUS.OK, 'User profile fetched successfully', {
    user: req.user.toJSON()
  });
});

/**
 * @desc    Update authenticated user profile
 * @route   PATCH /api/v1/auth/me
 * @access  Private (auth)
 */
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  // If user is a doctor, sync name and phone onto the Doctor profile
  if (user.role === ROLES.DOCTOR) {
    const doctorUpdates = {};
    if (name !== undefined) doctorUpdates.name = name;
    if (phone !== undefined) doctorUpdates.phone = phone;
    await Doctor.findOneAndUpdate({ userId: user._id }, doctorUpdates);
  }

  return sendSuccess(res, HTTP_STATUS.OK, 'Profile updated successfully', {
    user: user.toJSON()
  });
});

/**
 * @desc    Change authenticated user password
 * @route   PATCH /api/v1/auth/change-password
 * @access  Private (auth)
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Password changed successfully',
    null
  );
});

export default {
  signup,
  login,
  getMe,
  updateMe,
  changePassword
};

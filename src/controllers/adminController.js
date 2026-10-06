import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Clinic } from '../models/Clinic.js';
import { Hospital } from '../models/Hospital.js';
import { Pharmacy } from '../models/Pharmacy.js';
import { Laboratory } from '../models/Laboratory.js';
import { Appointment } from '../models/Appointment.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildQuery, executePaginatedQuery } from '../utils/queryBuilder.js';
import { HTTP_STATUS, DOCTOR_APPROVAL_STATUS } from '../config/constants.js';

const ALLOWED_USER_SORT_FIELDS = ['name', 'email', 'createdAt', 'role'];

/**
 * @desc    Get system-wide platform metrics and counts
 * @route   GET /api/v1/admin/stats
 * @access  Private (admin)
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    users,
    doctors,
    clinics,
    hospitals,
    pharmacies,
    laboratories,
    appointments,
    pendingDoctorApprovals,
    reviews
  ] = await Promise.all([
    User.countDocuments(),
    Doctor.countDocuments(),
    Clinic.countDocuments(),
    Hospital.countDocuments(),
    Pharmacy.countDocuments(),
    Laboratory.countDocuments(),
    Appointment.countDocuments(),
    Doctor.countDocuments({ approvalStatus: DOCTOR_APPROVAL_STATUS.PENDING }),
    Review.countDocuments()
  ]);

  return sendSuccess(res, HTTP_STATUS.OK, 'Admin stats fetched successfully', {
    users,
    doctors,
    clinics,
    hospitals,
    pharmacies,
    laboratories,
    appointments,
    pendingDoctorApprovals,
    reviews
  });
});

/**
 * @desc    Get paginated, filterable user directory
 * @route   GET /api/v1/admin/users
 * @access  Private (admin)
 */
export const getAdminUsers = asyncHandler(async (req, res) => {
  const baseFilter = {};

  if (req.query.role) {
    baseFilter.role = req.query.role;
  }

  const queryOptions = buildQuery({
    query: req.query,
    allowedSortFields: ALLOWED_USER_SORT_FIELDS,
    defaultSort: '-createdAt',
    searchFields: ['name', 'email', 'phone'],
    baseFilter
  });

  const { docs, meta } = await executePaginatedQuery(User, queryOptions);

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Users fetched successfully',
    docs.map((u) => u.toJSON()),
    meta
  );
});

/**
 * @desc    Toggle user active/deactivated status
 * @route   PATCH /api/v1/admin/users/:id/status
 * @access  Private (admin)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  // Prevent admin from deactivating themselves
  if (req.user._id.toString() === id && isActive === false) {
    throw ApiError.badRequest('Administrators cannot deactivate their own account');
  }

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.isActive = isActive;
  await user.save();

  // If user is doctor, sync doctor isActive state as well
  if (user.role === 'doctor') {
    await Doctor.findOneAndUpdate({ userId: user._id }, { isActive });
  }

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    user.toJSON()
  );
});

/**
 * @desc    Approve or reject doctor profile
 * @route   PATCH /api/v1/admin/doctors/:id/approval
 * @access  Private (admin)
 */
export const updateDoctorApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approvalStatus, reason } = req.body;

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  doctor.approvalStatus = approvalStatus;

  // If approved, automatically verify the doctor
  if (approvalStatus === DOCTOR_APPROVAL_STATUS.APPROVED) {
    doctor.isVerified = true;
  } else if (approvalStatus === DOCTOR_APPROVAL_STATUS.REJECTED) {
    doctor.isVerified = false;
  }

  await doctor.save();

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    `Doctor profile ${approvalStatus} successfully`,
    doctor.toJSON()
  );
});

export default {
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  updateDoctorApproval
};

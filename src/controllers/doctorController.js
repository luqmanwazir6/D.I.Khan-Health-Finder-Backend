import mongoose from 'mongoose';
import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildQuery, executePaginatedQuery } from '../utils/queryBuilder.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import { generateDoctorSlots } from '../services/appointmentService.js';
import {
  HTTP_STATUS,
  ROLES,
  DOCTOR_APPROVAL_STATUS
} from '../config/constants.js';

const ALLOWED_SORT_FIELDS = [
  'name',
  'specialty',
  'consultationFee',
  'ratingAverage',
  'ratingCount',
  'experienceYears',
  'createdAt'
];

/**
 * @desc    Get paginated, filtered, sorted list of doctors
 * @route   GET /api/v1/doctors
 * @access  Public
 */
export const getDoctors = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === ROLES.ADMIN;
  const includeInactive = isAdmin && req.query.includeInactive === 'true';

  const baseFilter = {};
  if (!includeInactive) {
    baseFilter.isActive = true;
    baseFilter.approvalStatus = DOCTOR_APPROVAL_STATUS.APPROVED;
  }

  // Doctor-specific filters
  if (req.query.specialty) {
    baseFilter.specialty = new RegExp(`^${req.query.specialty}$`, 'i');
  }

  if (req.query.area) {
    baseFilter.area = new RegExp(`^${req.query.area}$`, 'i');
  }

  if (req.query.gender && ['male', 'female'].includes(req.query.gender)) {
    baseFilter.gender = req.query.gender;
  }

  if (req.query.isVerified !== undefined) {
    baseFilter.isVerified = req.query.isVerified === 'true';
  }

  if (req.query.minRating !== undefined) {
    const minRating = parseFloat(req.query.minRating);
    if (!isNaN(minRating)) {
      baseFilter.ratingAverage = { $gte: minRating };
    }
  }

  if (req.query.minFee !== undefined || req.query.maxFee !== undefined) {
    baseFilter.consultationFee = {};
    if (req.query.minFee !== undefined) {
      const minFee = parseFloat(req.query.minFee);
      if (!isNaN(minFee)) baseFilter.consultationFee.$gte = minFee;
    }
    if (req.query.maxFee !== undefined) {
      const maxFee = parseFloat(req.query.maxFee);
      if (!isNaN(maxFee)) baseFilter.consultationFee.$lte = maxFee;
    }
  }

  if (req.query.availableDay) {
    baseFilter.availability = {
      $elemMatch: {
        day: req.query.availableDay.toLowerCase(),
        isAvailable: true
      }
    };
  }

  const queryOptions = buildQuery({
    query: req.query,
    allowedSortFields: ALLOWED_SORT_FIELDS,
    defaultSort: '-ratingAverage,name',
    searchFields: ['name', 'specialty', 'bio', 'area'],
    baseFilter
  });

  const { docs, meta } = await executePaginatedQuery(Doctor, queryOptions);

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Doctors fetched successfully',
    docs.map((d) => d.toJSON()),
    meta
  );
});

/**
 * @desc    Get currently logged-in doctor's profile
 * @route   GET /api/v1/doctors/me
 * @access  Private (doctor)
 */
export const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id });

  if (!doctor) {
    throw ApiError.notFound('Doctor profile not found for this account');
  }

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Doctor profile fetched successfully',
    doctor.toJSON()
  );
});

/**
 * @desc    Get doctor by ID or slug
 * @route   GET /api/v1/doctors/:id
 * @access  Public
 */
export const getDoctorByIdOrSlug = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);

  const query = isObjectId ? { _id: id } : { slug: id };

  const doctor = await Doctor.findOne(query);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  // Public callers can only view active, approved doctors
  const isAdmin = req.user && req.user.role === ROLES.ADMIN;
  const isOwner = req.user && doctor.userId && doctor.userId.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    if (!doctor.isActive || doctor.approvalStatus !== DOCTOR_APPROVAL_STATUS.APPROVED) {
      throw ApiError.notFound('Doctor not found or currently not available');
    }
  }

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Doctor details fetched successfully',
    doctor.toJSON()
  );
});

/**
 * @desc    Get available booking slots for a doctor on a specific date
 * @route   GET /api/v1/doctors/:id/slots
 * @access  Public
 */
export const getDoctorSlots = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { slug: id };

  const doctor = await Doctor.findOne(query);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  if (!doctor.isActive || doctor.approvalStatus !== DOCTOR_APPROVAL_STATUS.APPROVED) {
    throw ApiError.badRequest('Doctor is not currently available for appointments');
  }

  const slots = await generateDoctorSlots(doctor, date);

  return sendSuccess(res, HTTP_STATUS.OK, 'Slots fetched successfully', {
    date,
    slots
  });
});

/**
 * @desc    Create doctor profile (admin only)
 * @route   POST /api/v1/doctors
 * @access  Private (admin)
 */
export const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, phone, specialty, ...rest } = req.body;

  // Auto-generate unique slug
  const slug = await generateUniqueSlug(Doctor, name);

  // Link to existing user or create system placeholder user if none specified
  let userId = req.body.userId;
  if (!userId) {
    // Check if user with email already exists
    let user = email ? await User.findOne({ email }) : null;
    if (!user) {
      user = await User.create({
        name,
        email: email || `dr.${slug}@dikhanhealth.pk`,
        phone: phone || '03000000000',
        password: 'Password123!',
        role: ROLES.DOCTOR
      });
    }
    userId = user._id;
  }

  const doctor = await Doctor.create({
    userId,
    name,
    slug,
    specialty,
    phone,
    email,
    approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
    isVerified: true,
    ...rest
  });

  return sendSuccess(
    res,
    HTTP_STATUS.CREATED,
    'Doctor created successfully',
    doctor.toJSON()
  );
});

/**
 * @desc    Update doctor profile (admin or owning doctor)
 * @route   PATCH /api/v1/doctors/:id
 * @access  Private (admin or doctor)
 */
export const updateDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { slug: id };

  const doctor = await Doctor.findOne(query);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  const isAdmin = req.user.role === ROLES.ADMIN;
  const isOwner = doctor.userId && doctor.userId.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    throw ApiError.forbidden('You are not authorized to update this doctor profile');
  }

  const updates = { ...req.body };

  // Strict field whitelist protection: Doctors CANNOT change system fields
  if (!isAdmin) {
    delete updates.approvalStatus;
    delete updates.isVerified;
    delete updates.isActive;
    delete updates.ratingAverage;
    delete updates.ratingCount;
    delete updates.userId;
  }

  // If name changed, generate new unique slug
  if (updates.name && updates.name !== doctor.name) {
    updates.slug = await generateUniqueSlug(Doctor, updates.name, doctor._id);
  }

  Object.assign(doctor, updates);
  await doctor.save();

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Doctor profile updated successfully',
    doctor.toJSON()
  );
});

/**
 * @desc    Delete doctor profile (admin only)
 * @route   DELETE /api/v1/doctors/:id
 * @access  Private (admin)
 */
export const deleteDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { slug: id };

  const doctor = await Doctor.findOneAndDelete(query);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  return sendSuccess(res, HTTP_STATUS.OK, 'Doctor deleted successfully', null);
});

export default {
  getDoctors,
  getMyDoctorProfile,
  getDoctorByIdOrSlug,
  getDoctorSlots,
  createDoctor,
  updateDoctor,
  deleteDoctor
};

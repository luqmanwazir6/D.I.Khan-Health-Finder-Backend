import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildQuery, executePaginatedQuery } from '../utils/queryBuilder.js';
import {
  generateDoctorSlots,
  isDateInPast,
  computeEndTime
} from '../services/appointmentService.js';
import {
  HTTP_STATUS,
  ROLES,
  APPOINTMENT_STATUS,
  DOCTOR_APPROVAL_STATUS
} from '../config/constants.js';

const ALLOWED_SORT_FIELDS = ['date', 'startTime', 'createdAt', 'status'];

/**
 * Format populated appointment object to match Section 3.6 shape exactly:
 * { id, patient:{id,name,phone}, doctor:{id,name,specialty,photo}, date, startTime, endTime, reason, status, note, createdAt }
 */
function formatAppointment(doc) {
  const json = doc.toJSON ? doc.toJSON() : { ...doc };

  if (doc.patient && typeof doc.patient === 'object') {
    json.patient = {
      id: doc.patient._id ? doc.patient._id.toString() : doc.patient.id,
      name: doc.patient.name,
      phone: doc.patient.phone
    };
  }

  if (doc.doctor && typeof doc.doctor === 'object') {
    json.doctor = {
      id: doc.doctor._id ? doc.doctor._id.toString() : doc.doctor.id,
      name: doc.doctor.name,
      specialty: doc.doctor.specialty,
      photo: doc.doctor.photo || ''
    };
  }

  return json;
}

/**
 * @desc    Book a new doctor appointment (patient only)
 * @route   POST /api/v1/appointments
 * @access  Private (patient)
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, startTime, reason } = req.body;
  const patientId = req.user._id;

  // 1. Validate date is not in the past
  if (isDateInPast(date)) {
    throw ApiError.badRequest('Appointment date cannot be in the past');
  }

  // 2. Validate Doctor existence and status
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  if (!doctor.isActive || doctor.approvalStatus !== DOCTOR_APPROVAL_STATUS.APPROVED) {
    throw ApiError.badRequest('Doctor is currently not available for bookings');
  }

  // 3. Generate slots to verify requested time slot validity
  const slots = await generateDoctorSlots(doctor, date);
  const matchedSlot = slots.find((s) => s.startTime === startTime);

  if (!matchedSlot) {
    throw ApiError.badRequest(
      `Selected time (${startTime}) is outside the doctor's working schedule for this date`
    );
  }

  if (!matchedSlot.isAvailable) {
    throw ApiError.conflict('The selected time slot is already booked or no longer available');
  }

  // 4. Compute end time
  const endTime = matchedSlot.endTime || computeEndTime(startTime, doctor.slotDurationMinutes || 15);

  // 5. Create appointment (unique index on doctor+date+startTime prevents race conditions atomically)
  let appointment;
  try {
    appointment = await Appointment.create({
      patient: patientId,
      doctor: doctor._id,
      date,
      startTime,
      endTime,
      reason: reason || '',
      status: APPOINTMENT_STATUS.PENDING
    });
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict('The selected time slot has just been reserved by another patient');
    }
    throw err;
  }

  await appointment.populate([
    { path: 'patient', select: 'name phone' },
    { path: 'doctor', select: 'name specialty photo' }
  ]);

  return sendSuccess(
    res,
    HTTP_STATUS.CREATED,
    'Appointment booked successfully',
    formatAppointment(appointment)
  );
});

/**
 * @desc    Get authenticated patient's appointments
 * @route   GET /api/v1/appointments/my
 * @access  Private (patient)
 */
export const getMyAppointments = asyncHandler(async (req, res) => {
  const baseFilter = { patient: req.user._id };

  if (req.query.status) {
    baseFilter.status = req.query.status;
  }

  const queryOptions = buildQuery({
    query: req.query,
    allowedSortFields: ALLOWED_SORT_FIELDS,
    defaultSort: '-date,-startTime',
    baseFilter
  });

  const { docs, meta } = await executePaginatedQuery(Appointment, queryOptions, [
    { path: 'patient', select: 'name phone' },
    { path: 'doctor', select: 'name specialty photo' }
  ]);

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Appointments fetched successfully',
    docs.map(formatAppointment),
    meta
  );
});

/**
 * @desc    Get appointments for the logged-in doctor
 * @route   GET /api/v1/appointments/doctor
 * @access  Private (doctor)
 */
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    throw ApiError.notFound('Doctor profile not found for this user account');
  }

  const baseFilter = { doctor: doctor._id };

  if (req.query.status) {
    baseFilter.status = req.query.status;
  }

  if (req.query.date) {
    baseFilter.date = req.query.date;
  }

  const queryOptions = buildQuery({
    query: req.query,
    allowedSortFields: ALLOWED_SORT_FIELDS,
    defaultSort: 'date,startTime',
    baseFilter
  });

  const { docs, meta } = await executePaginatedQuery(Appointment, queryOptions, [
    { path: 'patient', select: 'name phone' },
    { path: 'doctor', select: 'name specialty photo' }
  ]);

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Doctor appointments fetched successfully',
    docs.map(formatAppointment),
    meta
  );
});

/**
 * @desc    Get all appointments system-wide (admin only)
 * @route   GET /api/v1/appointments
 * @access  Private (admin)
 */
export const getAllAppointments = asyncHandler(async (req, res) => {
  const baseFilter = {};

  if (req.query.status) {
    baseFilter.status = req.query.status;
  }

  if (req.query.doctorId && mongoose.Types.ObjectId.isValid(req.query.doctorId)) {
    baseFilter.doctor = new mongoose.Types.ObjectId(req.query.doctorId);
  }

  if (req.query.date) {
    baseFilter.date = req.query.date;
  }

  const queryOptions = buildQuery({
    query: req.query,
    allowedSortFields: ALLOWED_SORT_FIELDS,
    defaultSort: '-date,-startTime',
    baseFilter
  });

  const { docs, meta } = await executePaginatedQuery(Appointment, queryOptions, [
    { path: 'patient', select: 'name phone' },
    { path: 'doctor', select: 'name specialty photo' }
  ]);

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'All appointments fetched successfully',
    docs.map(formatAppointment),
    meta
  );
});

/**
 * @desc    Update appointment status (patient, doctor, admin)
 * @route   PATCH /api/v1/appointments/:id/status
 * @access  Private
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const user = req.user;

  const appointment = await Appointment.findById(id).populate([
    { path: 'patient', select: 'name phone' },
    { path: 'doctor', select: 'name specialty photo userId' }
  ]);

  if (!appointment) {
    throw ApiError.notFound('Appointment not found');
  }

  // Check terminal state: no changes permitted after completed or cancelled
  if (
    appointment.status === APPOINTMENT_STATUS.COMPLETED ||
    appointment.status === APPOINTMENT_STATUS.CANCELLED
  ) {
    throw ApiError.badRequest(
      `Cannot change status of an appointment that is already ${appointment.status}`
    );
  }

  const isAdmin = user.role === ROLES.ADMIN;
  const isPatient = appointment.patient && appointment.patient._id.toString() === user._id.toString();
  const isDoctor =
    appointment.doctor &&
    appointment.doctor.userId &&
    appointment.doctor.userId.toString() === user._id.toString();

  // Role permissions check
  if (isAdmin) {
    // Admin can set any status
  } else if (isDoctor) {
    const allowedDoctorStatuses = [
      APPOINTMENT_STATUS.CONFIRMED,
      APPOINTMENT_STATUS.COMPLETED,
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.NO_SHOW
    ];
    if (!allowedDoctorStatuses.includes(status)) {
      throw ApiError.badRequest(
        `Doctors can only set status to: [${allowedDoctorStatuses.join(', ')}]`
      );
    }
  } else if (isPatient) {
    // Patient can only cancel their own appointment
    if (status !== APPOINTMENT_STATUS.CANCELLED) {
      throw ApiError.forbidden('Patients are only authorized to cancel their appointments');
    }
  } else {
    throw ApiError.forbidden('You are not authorized to update this appointment');
  }

  appointment.status = status;
  if (note !== undefined) {
    appointment.note = note;
  }

  await appointment.save();

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Appointment status updated successfully',
    formatAppointment(appointment)
  );
});

export default {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus
};

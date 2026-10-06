import { Doctor } from '../models/Doctor.js';
import { Clinic } from '../models/Clinic.js';
import { Hospital } from '../models/Hospital.js';
import { Pharmacy } from '../models/Pharmacy.js';
import { Laboratory } from '../models/Laboratory.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS, DOCTOR_APPROVAL_STATUS } from '../config/constants.js';

/**
 * @desc    Get aggregate list of medical specialties with doctor counts
 * @route   GET /api/v1/meta/specialties
 * @access  Public
 */
export const getSpecialties = asyncHandler(async (req, res) => {
  const specialtiesAggregate = await Doctor.aggregate([
    {
      $match: {
        isActive: true,
        approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED
      }
    },
    {
      $group: {
        _id: '$specialty',
        doctorCount: { $sum: 1 }
      }
    },
    {
      $sort: { doctorCount: -1, _id: 1 }
    }
  ]);

  const specialties = specialtiesAggregate.map((item) => ({
    value: item._id,
    label: item._id,
    doctorCount: item.doctorCount
  }));

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Specialties fetched successfully',
    specialties
  );
});

/**
 * @desc    Get unique geographic areas across all providers in D.I. Khan
 * @route   GET /api/v1/meta/areas
 * @access  Public
 */
export const getAreas = asyncHandler(async (req, res) => {
  const [docAreas, clinicAreas, hospAreas, pharmAreas, labAreas] =
    await Promise.all([
      Doctor.distinct('area', {
        isActive: true,
        approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED
      }),
      Clinic.distinct('area', { isActive: true }),
      Hospital.distinct('area', { isActive: true }),
      Pharmacy.distinct('area', { isActive: true }),
      Laboratory.distinct('area', { isActive: true })
    ]);

  const allAreas = Array.from(
    new Set([
      ...docAreas,
      ...clinicAreas,
      ...hospAreas,
      ...pharmAreas,
      ...labAreas
    ])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return sendSuccess(res, HTTP_STATUS.OK, 'Areas fetched successfully', allAreas);
});

export default {
  getSpecialties,
  getAreas
};

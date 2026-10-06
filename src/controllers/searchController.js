import { Doctor } from '../models/Doctor.js';
import { Clinic } from '../models/Clinic.js';
import { Hospital } from '../models/Hospital.js';
import { Pharmacy } from '../models/Pharmacy.js';
import { Laboratory } from '../models/Laboratory.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { HTTP_STATUS, DOCTOR_APPROVAL_STATUS } from '../config/constants.js';

/**
 * @desc    Global multi-entity search across doctors and all facilities
 * @route   GET /api/v1/search
 * @access  Public
 */
export const searchAll = asyncHandler(async (req, res) => {
  const query = req.query.q ? req.query.q.trim() : '';
  const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

  if (!query) {
    return sendSuccess(res, HTTP_STATUS.OK, 'Search results', {
      doctors: [],
      clinics: [],
      hospitals: [],
      pharmacies: [],
      laboratories: []
    });
  }

  const escaped = escapeRegex(query);
  const regex = new RegExp(escaped, 'i');

  const doctorFilter = {
    isActive: true,
    approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
    $or: [{ name: regex }, { specialty: regex }, { bio: regex }, { area: regex }]
  };

  const facilityFilter = (extra = []) => ({
    isActive: true,
    $or: [
      { name: regex },
      { description: regex },
      { services: regex },
      { area: regex },
      ...extra
    ]
  });

  const [doctors, clinics, hospitals, pharmacies, laboratories] =
    await Promise.all([
      Doctor.find(doctorFilter).limit(limit).sort('-ratingAverage name').lean(),
      Clinic.find(facilityFilter([{ specialties: regex }]))
        .limit(limit)
        .sort('-ratingAverage name')
        .lean(),
      Hospital.find(facilityFilter([{ departments: regex }]))
        .limit(limit)
        .sort('-ratingAverage name')
        .lean(),
      Pharmacy.find(facilityFilter()).limit(limit).sort('-ratingAverage name').lean(),
      Laboratory.find(facilityFilter([{ 'tests.name': regex }]))
        .limit(limit)
        .sort('-ratingAverage name')
        .lean()
    ]);

  const transform = (doc) => ({
    ...doc,
    id: doc._id.toString(),
    _id: undefined,
    __v: undefined
  });

  return sendSuccess(res, HTTP_STATUS.OK, 'Search results fetched successfully', {
    doctors: doctors.map(transform),
    clinics: clinics.map(transform),
    hospitals: hospitals.map(transform),
    pharmacies: pharmacies.map(transform),
    laboratories: laboratories.map(transform)
  });
});

export default {
  searchAll
};

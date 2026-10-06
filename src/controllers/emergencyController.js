import { Hospital } from '../models/Hospital.js';
import { Pharmacy } from '../models/Pharmacy.js';
import { Laboratory } from '../models/Laboratory.js';
import { Clinic } from '../models/Clinic.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * @desc    Get all active 24/7 or emergency healthcare facilities
 * @route   GET /api/v1/emergency
 * @access  Public
 */
export const getEmergencyFacilities = asyncHandler(async (req, res) => {
  const emergencyFilter = {
    isActive: true,
    $or: [{ isEmergency: true }, { is24Hours: true }]
  };

  const [hospitals, pharmacies, laboratories, clinics] = await Promise.all([
    Hospital.find(emergencyFilter).sort('-ratingAverage name').lean(),
    Pharmacy.find(emergencyFilter).sort('-ratingAverage name').lean(),
    Laboratory.find(emergencyFilter).sort('-ratingAverage name').lean(),
    Clinic.find(emergencyFilter).sort('-ratingAverage name').lean()
  ]);

  const transform = (doc) => ({
    ...doc,
    id: doc._id.toString(),
    _id: undefined,
    __v: undefined
  });

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Emergency facilities fetched successfully',
    {
      hospitals: hospitals.map(transform),
      pharmacies: pharmacies.map(transform),
      laboratories: laboratories.map(transform),
      clinics: clinics.map(transform)
    }
  );
});

export default {
  getEmergencyFacilities
};

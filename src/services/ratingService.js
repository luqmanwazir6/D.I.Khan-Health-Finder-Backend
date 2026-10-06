import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Doctor } from '../models/Doctor.js';
import { Clinic } from '../models/Clinic.js';
import { Hospital } from '../models/Hospital.js';
import { Pharmacy } from '../models/Pharmacy.js';
import { Laboratory } from '../models/Laboratory.js';
import { TARGET_TYPES } from '../config/constants.js';

const modelMap = {
  [TARGET_TYPES.DOCTOR]: Doctor,
  [TARGET_TYPES.CLINIC]: Clinic,
  [TARGET_TYPES.HOSPITAL]: Hospital,
  [TARGET_TYPES.PHARMACY]: Pharmacy,
  [TARGET_TYPES.LABORATORY]: Laboratory
};

/**
 * Recalculate average rating and rating count for a target resource,
 * and persist updates to the respective target collection.
 *
 * @param {string} targetType
 * @param {string|mongoose.Types.ObjectId} targetId
 * @returns {Promise<{ ratingAverage: number, ratingCount: number }>}
 */
export async function recalculateRating(targetType, targetId) {
  const TargetModel = modelMap[targetType];
  if (!TargetModel) {
    return { ratingAverage: 0, ratingCount: 0 };
  }

  const targetObjectId = new mongoose.Types.ObjectId(targetId);

  const stats = await Review.aggregate([
    {
      $match: {
        targetType,
        targetId: targetObjectId
      }
    },
    {
      $group: {
        _id: '$targetId',
        count: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  let ratingAverage = 0;
  let ratingCount = 0;

  if (stats.length > 0) {
    ratingCount = stats[0].count;
    ratingAverage = Math.round(stats[0].averageRating * 10) / 10;
  }

  await TargetModel.findByIdAndUpdate(targetObjectId, {
    ratingAverage,
    ratingCount
  });

  return { ratingAverage, ratingCount };
}

export default {
  recalculateRating
};

import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Doctor } from '../models/Doctor.js';
import { Clinic } from '../models/Clinic.js';
import { Hospital } from '../models/Hospital.js';
import { Pharmacy } from '../models/Pharmacy.js';
import { Laboratory } from '../models/Laboratory.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildQuery, executePaginatedQuery } from '../utils/queryBuilder.js';
import { recalculateRating } from '../services/ratingService.js';
import { HTTP_STATUS, ROLES, TARGET_TYPES } from '../config/constants.js';

const targetModelMap = {
  [TARGET_TYPES.DOCTOR]: Doctor,
  [TARGET_TYPES.CLINIC]: Clinic,
  [TARGET_TYPES.HOSPITAL]: Hospital,
  [TARGET_TYPES.PHARMACY]: Pharmacy,
  [TARGET_TYPES.LABORATORY]: Laboratory
};

const ALLOWED_SORT_FIELDS = ['rating', 'createdAt'];

/**
 * @desc    Get paginated reviews for a specific target entity
 * @route   GET /api/v1/reviews
 * @access  Public
 */
export const getReviews = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.query;

  const baseFilter = {
    targetType,
    targetId: new mongoose.Types.ObjectId(targetId)
  };

  const queryOptions = buildQuery({
    query: req.query,
    allowedSortFields: ALLOWED_SORT_FIELDS,
    defaultSort: '-createdAt',
    baseFilter
  });

  const { docs, meta } = await executePaginatedQuery(
    Review,
    queryOptions,
    { path: 'user', select: 'name avatar' }
  );

  const formattedReviews = docs.map((doc) => {
    const json = doc.toJSON();
    if (doc.user && typeof doc.user === 'object') {
      json.user = {
        id: doc.user._id ? doc.user._id.toString() : doc.user.id,
        name: doc.user.name,
        avatar: doc.user.avatar || ''
      };
    }
    return json;
  });

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Reviews fetched successfully',
    formattedReviews,
    meta
  );
});

/**
 * @desc    Create a review for a doctor or facility (patients only)
 * @route   POST /api/v1/reviews
 * @access  Private (patient)
 */
export const createReview = asyncHandler(async (req, res) => {
  const { targetType, targetId, rating, comment } = req.body;
  const userId = req.user._id;

  // 1. Verify target exists
  const TargetModel = targetModelMap[targetType];
  if (!TargetModel) {
    throw ApiError.badRequest('Invalid targetType specified');
  }

  const targetDoc = await TargetModel.findById(targetId);
  if (!targetDoc) {
    throw ApiError.notFound('Target entity does not exist');
  }

  // 2. Check for duplicate review by same patient
  const existingReview = await Review.findOne({
    user: userId,
    targetType,
    targetId
  });

  if (existingReview) {
    throw ApiError.conflict('You have already submitted a review for this provider');
  }

  // 3. Create review
  const review = await Review.create({
    user: userId,
    targetType,
    targetId,
    rating,
    comment: comment || ''
  });

  // 4. Recalculate target rating and count
  await recalculateRating(targetType, targetId);

  // 5. Populate user info for response
  await review.populate('user', 'name avatar');

  const json = review.toJSON();
  json.user = {
    id: review.user._id ? review.user._id.toString() : review.user.id,
    name: review.user.name,
    avatar: review.user.avatar || ''
  };

  return sendSuccess(
    res,
    HTTP_STATUS.CREATED,
    'Review submitted successfully',
    json
  );
});

/**
 * @desc    Update own review
 * @route   PATCH /api/v1/reviews/:id
 * @access  Private (author)
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You are only authorized to edit your own reviews');
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  // Recalculate target average rating
  await recalculateRating(review.targetType, review.targetId);

  await review.populate('user', 'name avatar');

  const json = review.toJSON();
  json.user = {
    id: review.user._id ? review.user._id.toString() : review.user.id,
    name: review.user.name,
    avatar: review.user.avatar || ''
  };

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'Review updated successfully',
    json
  );
});

/**
 * @desc    Delete review (author or admin)
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private (author or admin)
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  const isAuthor = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isAuthor && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to delete this review');
  }

  const { targetType, targetId } = review;
  await Review.findByIdAndDelete(id);

  // Recalculate target average rating
  await recalculateRating(targetType, targetId);

  return sendSuccess(res, HTTP_STATUS.OK, 'Review deleted successfully', null);
});

export default {
  getReviews,
  createReview,
  updateReview,
  deleteReview
};

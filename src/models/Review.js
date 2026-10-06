import mongoose from 'mongoose';
import { TARGET_TYPE_LIST } from '../config/constants.js';
import { configureSchemaTransform } from '../utils/schemaHelper.js';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetType: {
      type: String,
      enum: TARGET_TYPE_LIST,
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      default: '',
      maxlength: [500, 'Comment cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one review per user per target entity
reviewSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
reviewSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

configureSchemaTransform(reviewSchema);

export const Review = mongoose.model('Review', reviewSchema);
export default Review;

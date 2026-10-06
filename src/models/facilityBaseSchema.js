import mongoose from 'mongoose';
import { DAYS_OF_WEEK, DEFAULT_CITY } from '../config/constants.js';

export const openingHourSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAYS_OF_WEEK,
      required: true
    },
    openTime: {
      type: String,
      default: '08:00'
    },
    closeTime: {
      type: String,
      default: '22:00'
    },
    isClosed: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

export const defaultOpeningHours = DAYS_OF_WEEK.map((day) => ({
  day,
  openTime: '08:00',
  closeTime: '22:00',
  isClosed: day === 'sunday'
}));

/**
 * Returns common schema fields for healthcare facilities.
 */
export function getBaseFacilityFields() {
  return {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    whatsapp: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true
    },
    city: {
      type: String,
      default: DEFAULT_CITY,
      trim: true
    },
    coordinates: {
      lat: { type: Number, default: 31.8314 },
      lng: { type: Number, default: 70.9019 }
    },
    openingHours: {
      type: [openingHourSchema],
      default: defaultOpeningHours
    },
    is24Hours: {
      type: Boolean,
      default: false
    },
    isEmergency: {
      type: Boolean,
      default: false
    },
    services: {
      type: [String],
      default: []
    },
    image: {
      type: String,
      default: ''
    },
    gallery: {
      type: [String],
      default: []
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  };
}

export default {
  openingHourSchema,
  defaultOpeningHours,
  getBaseFacilityFields
};

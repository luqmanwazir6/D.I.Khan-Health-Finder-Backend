import mongoose from 'mongoose';
import {
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_APPROVAL_STATUS_LIST,
  DAYS_OF_WEEK,
  GENDERS,
  DEFAULT_CITY
} from '../config/constants.js';
import { configureSchemaTransform } from '../utils/schemaHelper.js';

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAYS_OF_WEEK,
      required: true
    },
    startTime: {
      type: String, // "HH:mm"
      required: true
    },
    endTime: {
      type: String, // "HH:mm"
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
      trim: true
    },
    qualifications: {
      type: [String],
      default: []
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0
    },
    gender: {
      type: String,
      enum: GENDERS,
      default: 'male'
    },
    bio: {
      type: String,
      default: ''
    },
    languages: {
      type: [String],
      default: ['Urdu', 'English', 'Saraiki']
    },
    consultationFee: {
      type: Number,
      default: 1000,
      min: 0
    },
    photo: {
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
    clinicName: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    area: {
      type: String,
      default: 'Circular Road',
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
    availability: {
      type: [availabilitySlotSchema],
      default: [
        { day: 'monday', startTime: '09:00', endTime: '14:00', isAvailable: true },
        { day: 'tuesday', startTime: '09:00', endTime: '14:00', isAvailable: true },
        { day: 'wednesday', startTime: '09:00', endTime: '14:00', isAvailable: true },
        { day: 'thursday', startTime: '09:00', endTime: '14:00', isAvailable: true },
        { day: 'friday', startTime: '09:00', endTime: '13:00', isAvailable: true },
        { day: 'saturday', startTime: '09:00', endTime: '14:00', isAvailable: true }
      ]
    },
    slotDurationMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 60
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
    approvalStatus: {
      type: String,
      enum: DOCTOR_APPROVAL_STATUS_LIST,
      default: DOCTOR_APPROVAL_STATUS.PENDING
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
doctorSchema.index({ specialty: 1, area: 1, approvalStatus: 1, isActive: 1 });
doctorSchema.index({ ratingAverage: -1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ name: 'text', specialty: 'text', bio: 'text', area: 'text' });

configureSchemaTransform(doctorSchema);

export const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;

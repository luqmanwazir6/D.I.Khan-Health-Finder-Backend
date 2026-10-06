import mongoose from 'mongoose';
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_LIST
} from '../config/constants.js';
import { configureSchemaTransform } from '../utils/schemaHelper.js';

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: [true, 'Appointment date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    },
    startTime: {
      type: String, // "HH:mm"
      required: [true, 'Start time is required'],
      match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Start time must be formatted as HH:mm']
    },
    endTime: {
      type: String, // "HH:mm"
      required: [true, 'End time is required'],
      match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'End time must be formatted as HH:mm']
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUS_LIST,
      default: APPOINTMENT_STATUS.PENDING
    },
    note: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Atomic unique partial index preventing double-booking races for non-cancelled appointments
appointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: APPOINTMENT_STATUS.CANCELLED } }
  }
);

// Query optimization indexes
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: 1, status: 1 });
appointmentSchema.index({ date: 1, status: 1 });

configureSchemaTransform(appointmentSchema);

export const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;

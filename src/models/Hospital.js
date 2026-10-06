import mongoose from 'mongoose';
import { getBaseFacilityFields } from './facilityBaseSchema.js';
import { configureSchemaTransform } from '../utils/schemaHelper.js';

const hospitalSchema = new mongoose.Schema(
  {
    ...getBaseFacilityFields(),
    departments: {
      type: [String],
      default: []
    },
    bedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    emergencyPhone: {
      type: String,
      default: ''
    },
    ambulanceAvailable: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

hospitalSchema.index({ area: 1, isActive: 1, isEmergency: 1 });
hospitalSchema.index({ is24Hours: 1, ambulanceAvailable: 1 });
hospitalSchema.index({ ratingAverage: -1 });
hospitalSchema.index({ name: 'text', description: 'text', services: 'text', departments: 'text', area: 'text' });

configureSchemaTransform(hospitalSchema);

export const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;

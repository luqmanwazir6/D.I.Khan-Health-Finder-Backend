import mongoose from 'mongoose';
import { getBaseFacilityFields } from './facilityBaseSchema.js';
import { configureSchemaTransform } from '../utils/schemaHelper.js';

const clinicSchema = new mongoose.Schema(
  {
    ...getBaseFacilityFields(),
    specialties: {
      type: [String],
      default: []
    },
    doctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
      }
    ]
  },
  {
    timestamps: true
  }
);

clinicSchema.index({ area: 1, isActive: 1, isVerified: 1 });
clinicSchema.index({ is24Hours: 1, isEmergency: 1 });
clinicSchema.index({ ratingAverage: -1 });
clinicSchema.index({ name: 'text', description: 'text', services: 'text', area: 'text' });

configureSchemaTransform(clinicSchema);

export const Clinic = mongoose.model('Clinic', clinicSchema);
export default Clinic;

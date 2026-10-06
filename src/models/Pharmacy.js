import mongoose from 'mongoose';
import { getBaseFacilityFields } from './facilityBaseSchema.js';
import { configureSchemaTransform } from '../utils/schemaHelper.js';

const pharmacySchema = new mongoose.Schema(
  {
    ...getBaseFacilityFields(),
    licenseNumber: {
      type: String,
      default: ''
    },
    deliveryAvailable: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

pharmacySchema.index({ area: 1, isActive: 1 });
pharmacySchema.index({ is24Hours: 1, deliveryAvailable: 1 });
pharmacySchema.index({ ratingAverage: -1 });
pharmacySchema.index({ name: 'text', description: 'text', services: 'text', area: 'text' });

configureSchemaTransform(pharmacySchema);

export const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);
export default Pharmacy;

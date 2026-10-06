import mongoose from 'mongoose';
import { getBaseFacilityFields } from './facilityBaseSchema.js';
import { configureSchemaTransform } from '../utils/schemaHelper.js';

const labTestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const laboratorySchema = new mongoose.Schema(
  {
    ...getBaseFacilityFields(),
    tests: {
      type: [labTestSchema],
      default: []
    },
    homeSampleCollection: {
      type: Boolean,
      default: false
    },
    reportDeliveryTime: {
      type: String,
      default: '24 hours'
    }
  },
  {
    timestamps: true
  }
);

laboratorySchema.index({ area: 1, isActive: 1 });
laboratorySchema.index({ homeSampleCollection: 1 });
laboratorySchema.index({ ratingAverage: -1 });
laboratorySchema.index({ name: 'text', description: 'text', services: 'text', 'tests.name': 'text', area: 'text' });

configureSchemaTransform(laboratorySchema);

export const Laboratory = mongoose.model('Laboratory', laboratorySchema);
export default Laboratory;

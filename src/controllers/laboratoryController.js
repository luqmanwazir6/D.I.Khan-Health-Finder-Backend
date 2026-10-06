import { Laboratory } from '../models/Laboratory.js';
import { createFacilityController } from './facilityControllerFactory.js';

const laboratoryController = createFacilityController(
  Laboratory,
  'Laboratories',
  (query, filter) => {
    if (query.homeSampleCollection !== undefined) {
      filter.homeSampleCollection = query.homeSampleCollection === 'true';
    }
  }
);

export const {
  getList: getLaboratories,
  getByIdOrSlug: getLaboratoryByIdOrSlug,
  create: createLaboratory,
  update: updateLaboratory,
  remove: deleteLaboratory
} = laboratoryController;

export default laboratoryController;

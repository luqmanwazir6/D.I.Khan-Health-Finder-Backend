import { Hospital } from '../models/Hospital.js';
import { createFacilityController } from './facilityControllerFactory.js';

const hospitalController = createFacilityController(
  Hospital,
  'Hospitals',
  (query, filter) => {
    if (query.ambulanceAvailable !== undefined) {
      filter.ambulanceAvailable = query.ambulanceAvailable === 'true';
    }
  }
);

export const {
  getList: getHospitals,
  getByIdOrSlug: getHospitalByIdOrSlug,
  create: createHospital,
  update: updateHospital,
  remove: deleteHospital
} = hospitalController;

export default hospitalController;

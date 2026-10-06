import { Clinic } from '../models/Clinic.js';
import { createFacilityController } from './facilityControllerFactory.js';

const clinicController = createFacilityController(
  Clinic,
  'Clinics',
  (query, filter) => {
    if (query.specialty) {
      filter.specialties = { $in: [new RegExp(`^${query.specialty}$`, 'i')] };
    }
  },
  'doctors'
);

export const {
  getList: getClinics,
  getByIdOrSlug: getClinicByIdOrSlug,
  create: createClinic,
  update: updateClinic,
  remove: deleteClinic
} = clinicController;

export default clinicController;

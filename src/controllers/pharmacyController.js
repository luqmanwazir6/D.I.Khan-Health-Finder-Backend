import { Pharmacy } from '../models/Pharmacy.js';
import { createFacilityController } from './facilityControllerFactory.js';

const pharmacyController = createFacilityController(
  Pharmacy,
  'Pharmacies',
  (query, filter) => {
    if (query.deliveryAvailable !== undefined) {
      filter.deliveryAvailable = query.deliveryAvailable === 'true';
    }
  }
);

export const {
  getList: getPharmacies,
  getByIdOrSlug: getPharmacyByIdOrSlug,
  create: createPharmacy,
  update: updatePharmacy,
  remove: deletePharmacy
} = pharmacyController;

export default pharmacyController;

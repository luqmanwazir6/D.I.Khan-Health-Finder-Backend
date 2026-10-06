import express from 'express';
import {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createAppointmentValidator,
  updateAppointmentStatusValidator
} from '../validators/appointmentValidators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

// 1. Patient creates appointment
router.post(
  '/',
  authorize(ROLES.PATIENT),
  validate(createAppointmentValidator),
  createAppointment
);

// 2. Patient views their own appointments
router.get('/my', authorize(ROLES.PATIENT), getMyAppointments);

// 3. Doctor views their schedule
router.get('/doctor', authorize(ROLES.DOCTOR), getDoctorAppointments);

// 4. Admin views all appointments
router.get('/', authorize(ROLES.ADMIN), getAllAppointments);

// 5. Update appointment status (Patient, Doctor, Admin)
router.patch(
  '/:id/status',
  validate(updateAppointmentStatusValidator),
  updateAppointmentStatus
);

export default router;

import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import clinicRoutes from './clinicRoutes.js';
import hospitalRoutes from './hospitalRoutes.js';
import pharmacyRoutes from './pharmacyRoutes.js';
import laboratoryRoutes from './laboratoryRoutes.js';
import emergencyRoutes from './emergencyRoutes.js';
import metaRoutes from './metaRoutes.js';
import searchRoutes from './searchRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// 1. System Health
router.use('/health', healthRoutes);

// 2. Authentication
router.use('/auth', authRoutes);

// 3. Healthcare Providers & Facilities
router.use('/doctors', doctorRoutes);
router.use('/clinics', clinicRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/pharmacies', pharmacyRoutes);
router.use('/laboratories', laboratoryRoutes);

// 4. Discovery, Search, Emergency & Meta
router.use('/emergency', emergencyRoutes);
router.use('/meta', metaRoutes);
router.use('/search', searchRoutes);

// 5. Patient Engagements & Clinical Operations
router.use('/reviews', reviewRoutes);
router.use('/appointments', appointmentRoutes);

// 6. Platform Administration
router.use('/admin', adminRoutes);

export default router;

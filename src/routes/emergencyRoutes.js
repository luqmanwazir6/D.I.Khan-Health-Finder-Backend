import express from 'express';
import { getEmergencyFacilities } from '../controllers/emergencyController.js';

const router = express.Router();

router.get('/', getEmergencyFacilities);

export default router;

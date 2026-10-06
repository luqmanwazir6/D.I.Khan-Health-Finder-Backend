import express from 'express';
import { getSpecialties, getAreas } from '../controllers/metaController.js';

const router = express.Router();

router.get('/specialties', getSpecialties);
router.get('/areas', getAreas);

export default router;

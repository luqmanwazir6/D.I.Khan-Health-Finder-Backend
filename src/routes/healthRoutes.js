import express from 'express';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API Health Check & status
 * @access  Public
 */
router.get('/', (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };

  return sendSuccess(
    res,
    HTTP_STATUS.OK,
    'D.I. Khan Health Finder API is healthy',
    healthData
  );
});

export default router;

import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware factory executing express-validator validation chains.
 * If validation errors exist, converts them to Section 3.4 format:
 * { field: error.path, message: error.msg }
 *
 * @param {Array<import('express-validator').ValidationChain>} validations
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const details = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return next(ApiError.validationError('Validation failed', details));
  };
};

export default validate;

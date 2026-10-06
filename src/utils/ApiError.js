import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

/**
 * Standardized Operational Application Error
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {string} code - Error code identifier from ERROR_CODES
   * @param {Array|null} details - Optional array of field validation errors
   */
  constructor(statusCode, message, code = ERROR_CODES.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    if (details && Array.isArray(details)) {
      this.details = details;
    }
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request') {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, ERROR_CODES.BAD_REQUEST);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden access') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message = 'Resource conflict') {
    return new ApiError(HTTP_STATUS.CONFLICT, message, ERROR_CODES.CONFLICT);
  }

  static validationError(message = 'Validation failed', details = []) {
    return new ApiError(
      HTTP_STATUS.VALIDATION_ERROR,
      message,
      ERROR_CODES.VALIDATION_ERROR,
      details
    );
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message, ERROR_CODES.TOO_MANY_REQUESTS);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
}

export default ApiError;

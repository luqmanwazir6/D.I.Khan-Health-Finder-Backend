import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import { env } from '../config/env.js';

/**
 * Centralized Express Error Handling Middleware.
 * Conforms strictly to the API Contract in Section 3.4.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let code = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // 1. Mongoose Bad ObjectId / CastError -> 400 BAD_REQUEST
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ERROR_CODES.BAD_REQUEST;
    message = `Invalid value for parameter '${err.path}'`;
    details = null;
  }

  // 2. Mongoose Schema Validation Error -> 422 VALIDATION_ERROR
  else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.VALIDATION_ERROR;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message
    }));
  }

  // 3. Mongoose Duplicate Key Error (code 11000) -> 409 CONFLICT
  else if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    code = ERROR_CODES.CONFLICT;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'resource';
    message = `A record with this ${duplicatedField} already exists`;
    details = null;
  }

  // 4. JWT Authentication / Verification Errors -> 401 UNAUTHORIZED
  else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = ERROR_CODES.UNAUTHORIZED;
    message = 'Invalid authentication token';
    details = null;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = ERROR_CODES.UNAUTHORIZED;
    message = 'Authentication token expired';
    details = null;
  }

  // 5. Express JSON Syntax Error -> 400 BAD_REQUEST
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ERROR_CODES.BAD_REQUEST;
    message = 'Malformed JSON body in request';
    details = null;
  }

  // 6. Generic unhandled exceptions
  else if (!err.isOperational) {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    code = ERROR_CODES.INTERNAL_SERVER_ERROR;
    message = env.isProduction ? 'Internal server error' : (err.message || 'Internal server error');
    details = null;
  }

  // Log non-operational or 500 errors for observability
  if (statusCode >= 500) {
    console.error(`[Server Error] [${req.method}] ${req.originalUrl}:`, err);
  }

  // Construct error payload conforming to Section 3.4
  const errorResponse = {
    code
  };

  // details is ONLY present for VALIDATION_ERROR
  if (code === ERROR_CODES.VALIDATION_ERROR && Array.isArray(details) && details.length > 0) {
    errorResponse.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error: errorResponse
  });
}

export default errorHandler;

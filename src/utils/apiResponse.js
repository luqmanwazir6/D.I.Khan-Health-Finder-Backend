import { HTTP_STATUS } from '../config/constants.js';

/**
 * Sends a standardized JSON success response.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object|array|null} data
 * @param {object|null} meta - Pagination metadata if applicable
 */
export function sendSuccess(res, statusCode = HTTP_STATUS.OK, message = 'Success', data = null, meta = null) {
  const payload = {
    success: true,
    message,
    data
  };

  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

/**
 * Helper to build pagination meta object matching Section 3.3
 */
export function buildPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit) || 0;
  return {
    page: Number(page),
    limit: Number(limit),
    total: Number(total),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

export default {
  sendSuccess,
  buildPaginationMeta
};

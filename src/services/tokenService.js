import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a signed JWT token.
 *
 * @param {object} payload - Claims to embed in token (id, role, etc.)
 * @returns {string} Signed JWT token string
 */
export function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

/**
 * Verify and decode a JWT token.
 *
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export default {
  generateToken,
  verifyToken
};

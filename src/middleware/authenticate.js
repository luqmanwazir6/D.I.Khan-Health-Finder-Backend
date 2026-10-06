import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../services/tokenService.js';
import { User } from '../models/User.js';

/**
 * Middleware enforcing valid JWT Bearer token authentication.
 * Verifies that the user still exists in the database and is currently active.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Authentication token required'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing'));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return next(err); // Handled by centralized errorHandler (JsonWebTokenError / TokenExpiredError)
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists'));
    }

    if (!user.isActive) {
      return next(
        ApiError.forbidden('Your account has been deactivated. Please contact support.')
      );
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export default authenticate;

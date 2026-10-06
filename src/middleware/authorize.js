import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware factory.
 * Ensures the authenticated user possesses one of the allowed roles.
 *
 * @param  {...string} allowedRoles
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: your role (${req.user.role}) is not authorized to access this resource`
        )
      );
    }

    return next();
  };
}

export default authorize;

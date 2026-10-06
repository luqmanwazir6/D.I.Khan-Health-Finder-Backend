/**
 * Wrapper to catch unhandled async errors in route controllers and forward to next(err)
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

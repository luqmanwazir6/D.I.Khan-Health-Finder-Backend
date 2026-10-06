/**
 * NoSQL Injection Sanitizer Middleware.
 * Recursively removes keys containing forbidden characters ($ or .) from request body, query, and params.
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys that start with $ or contain dot
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleanObj[key] = sanitizeObject(value);
  }
  return cleanObj;
}

export function sanitizeInput(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

export default sanitizeInput;

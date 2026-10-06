import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS configuration (supports comma-separated origins)
const allowedOrigins = env.CLIENT_URL.split(',').map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. HTTP Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

// 4. Request Body Parsing with strict limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. NoSQL Injection Sanitization
app.use(sanitizeInput);

// 6. Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: {
      code: 'TOO_MANY_REQUESTS'
    }
  }
});
app.use('/api', globalLimiter);

// 7. Interactive OpenAPI Swagger Documentation
try {
  const swaggerDocument = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './docs/openapi.json'), 'utf8')
  );
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('[Swagger] Notice: openapi.json could not be loaded for /api/docs:', err.message);
}

// 8. Mount Core API v1 Routes
app.use('/api/v1', routes);

// 9. 404 Catch-All Middleware
app.use(notFoundHandler);

// 10. Centralized Error Handler
app.use(errorHandler);

export default app;

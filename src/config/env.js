import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validate and export environment configurations.
 * Enforces fail-fast behavior if mission-critical environment variables are missing or insecure.
 */
function validateEnv() {
  const missingVars = [];

  if (!process.env.MONGODB_URI) {
    missingVars.push('MONGODB_URI');
  }

  if (!process.env.JWT_SECRET) {
    missingVars.push('JWT_SECRET');
  } else if (process.env.JWT_SECRET.length < 32) {
    console.error(
      '[FATAL ERROR] JWT_SECRET must be at least 32 characters long for cryptographic security.'
    );
    process.exit(1);
  }

  if (missingVars.length > 0) {
    console.error(
      `[FATAL ERROR] Required environment variable(s) missing: ${missingVars.join(', ')}`
    );
    console.error('Please configure them in your server/.env file.');
    process.exit(1);
  }
}

// In test environment, allow mock values if not provided
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dikhan-health-finder',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_signing_key_dikhan_health_platform_2025_32chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || 'Super Admin',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin@dikhanhealth.pk',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'AdminPass123!'
};

export default env;

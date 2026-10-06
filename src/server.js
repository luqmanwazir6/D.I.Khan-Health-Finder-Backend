import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

let server;

async function startServer() {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Start HTTP server
    server = app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(`  D.I. Khan Health Finder API Server Running!`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Port:        ${env.PORT}`);
      console.log(`  Health Check: http://localhost:${env.PORT}/api/v1/health`);
      console.log('====================================================');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `[Server Error] Port ${env.PORT} is already in use by another process. Please close the process using port ${env.PORT} or change PORT in .env`
        );
      } else {
        console.error(`[Server Error] ${err.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`[Server Bootstrap Error] ${error.message}`);
    process.exit(1);
  }
}

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      console.log('[Server] Process terminated cleanly.');
      process.exit(0);
    });

    // Force close if graceful shutdown takes too long
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Process-level signal and error handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
  // In production, initiate graceful shutdown
  if (env.isProduction) {
    gracefulShutdown('unhandledRejection');
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception] thrown:', error);
  process.exit(1);
});

// Launch server
startServer();

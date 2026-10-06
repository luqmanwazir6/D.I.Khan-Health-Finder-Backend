import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect to MongoDB instance using MONGODB_URI from env.
 * Supports both local MongoDB and MongoDB Atlas seamlessly.
 */
export async function connectDB(customUri) {
  const uri = customUri || env.MONGODB_URI;

  try {
    mongoose.set('strictQuery', true);

    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    console.log(
      `[Database] Successfully connected to MongoDB at ${connection.connection.host}/${connection.connection.name}`
    );

    return connection;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Gracefully disconnect from MongoDB.
 */
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB');
  } catch (error) {
    console.error(`[Database Error] Disconnection error: ${error.message}`);
  }
}

export default {
  connectDB,
  disconnectDB
};

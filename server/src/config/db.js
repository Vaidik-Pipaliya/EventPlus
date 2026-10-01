import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let memoryServer = null;

export const connectDB = async () => {
  try {
    // Attempt connecting to specified MONGO_URI
    mongoose.set('strictQuery', false);
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2500
    });
    logger.info(`MongoDB connected successfully to ${env.MONGO_URI}`);
  } catch (err) {
    logger.warn(`Could not connect to external/local MongoDB at ${env.MONGO_URI}: ${err.message}`);
    logger.info('Starting fallback embedded in-memory MongoDB server for testing/evaluation...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      logger.info(`Embedded MongoDB running at ${memUri}`);
    } catch (memErr) {
      logger.error('Failed to start in-memory MongoDB fallback', memErr);
      throw memErr;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (err) {
    logger.error('Error during MongoDB disconnect', err);
  }
};

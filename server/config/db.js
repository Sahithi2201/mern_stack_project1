import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// CRITICAL: fail fast, don't hang if database connection issues occur
mongoose.set('bufferCommands', false);

let mongoMemoryServer = null;

/**
 * Connect to MongoDB using Mongoose ODM
 * Tries configured MONGO_URI first; if unavailable, automatically spins up
 * an embedded MongoMemoryServer so the app runs smoothly without external setup.
 */
const connectDB = async () => {
  const configuredURI = process.env.MONGO_URI;

  // 1. If explicit non-local URI provided, try connecting
  if (configuredURI && !configuredURI.includes('127.0.0.1:27017') && !configuredURI.includes('localhost:27017')) {
    try {
      const conn = await mongoose.connect(configuredURI, { serverSelectionTimeoutMS: 3000 });
      console.log(`=========================================`);
      console.log(`✅ MongoDB Connected Successfully!`);
      console.log(`Host: ${conn.connection.host}`);
      console.log(`Database: ${conn.connection.name}`);
      console.log(`=========================================`);
      return conn;
    } catch (err) {
      console.warn(`⚠️ Could not connect to remote MONGO_URI: ${err.message}. Falling back...`);
    }
  }

  // 2. Try local mongod instance with a quick timeout (1500ms)
  try {
    const conn = await mongoose.connect(configuredURI || 'mongodb://127.0.0.1:27017/ticket_management_system', {
      serverSelectionTimeoutMS: 1500,
    });
    console.log(`=========================================`);
    console.log(`✅ Connected to local MongoDB instance: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`=========================================`);
    return conn;
  } catch (localErr) {
    console.log('ℹ️ Local mongod daemon not detected. Bootstrapping embedded in-memory MongoDB...');
  }

  // 3. Fallback to embedded MongoMemoryServer
  try {
    mongoMemoryServer = await MongoMemoryServer.create();
    const inMemoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(inMemoryUri);
    console.log(`=========================================`);
    console.log(`✅ Embedded In-Memory MongoDB Initialized & Connected!`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`=========================================`);
    return conn;
  } catch (memErr) {
    console.error(`❌ Failed to start in-memory MongoDB: ${memErr.message}`);
    throw memErr;
  }
};

export default connectDB;

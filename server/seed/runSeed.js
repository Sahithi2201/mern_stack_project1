import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import generateSeats from '../utils/generateSeats.js';
import get100Events from './events100Data.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function runStandaloneSeed() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB');

    // 1. Purge any demo accounts
    await User.deleteMany({
      email: { $in: ['admin@example.com', 'user@example.com', 'admin@tixora.com', 'demo@gmail.com'] },
    });
    console.log('Purged demo accounts');

    // 2. Clear only the event collection
    await Event.deleteMany({});
    console.log('Cleared existing demo events');

    // 3. Insert 100 events
    const rawList = get100Events();
    const eventDocs = rawList.map((e) => ({
      ...e,
      seats: generateSeats(e.totalSeats),
    }));

    await Event.insertMany(eventDocs);
    const count = await Event.countDocuments();
    console.log(`Inserted ${count} events successfully`);

    // 4. Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

runStandaloneSeed();

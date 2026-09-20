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

    // 1. Ensure admin and demo user exist
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedAdminPassword = await bcrypt.hash('Admin@123', salt);
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
      });
      console.log('Admin user initialized: admin@example.com');
    }

    const userEmail = 'user@example.com';
    const existingUser = await User.findOne({ email: userEmail });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedUserPassword = await bcrypt.hash('User@123', salt);
      await User.create({
        name: 'Demo User',
        email: userEmail,
        password: hashedUserPassword,
        role: 'user',
      });
      console.log('Demo customer user initialized: user@example.com');
    }

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

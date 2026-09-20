import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Event from '../models/Event.js';
import generateSeats from '../utils/generateSeats.js';
import get100Events from './events100Data.js';

dotenv.config();

/**
 * Seed database with default admin user, demo user, and full 100-event catalog.
 */
export const seedDatabaseIfEmpty = async (force = false) => {
  try {
    // 1. Default admin details
    const adminEmail = 'admin@example.com';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123';

    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
      });
      console.log('✅ Initial Admin User seeded: admin@example.com');
    }

    // 2. Demo customer user
    const userEmail = 'user@example.com';
    const existingUser = await User.findOne({ email: userEmail });
    if (!existingUser) {
      const hashedUserPassword = await bcrypt.hash('User@123', salt);
      await User.create({
        name: 'Demo User',
        email: userEmail,
        password: hashedUserPassword,
        role: 'user',
      });
      console.log('✅ Initial Demo User seeded: user@example.com');
    }

    // 3. Seed 100 Events across 20 Indian cities if fewer than 100 exist or force requested
    const currentEventCount = await Event.countDocuments();
    if (currentEventCount < 100 || force) {
      console.log(`=========================================`);
      console.log(`Seeding 100 events across 20 Indian cities... (Current count: ${currentEventCount})`);
      
      if (force || currentEventCount > 0) {
        await Event.deleteMany({});
        console.log('Cleared existing demo events collection.');
      }

      const eventsList = get100Events();
      const eventsWithSeats = eventsList.map((evt) => ({
        ...evt,
        seats: generateSeats(evt.totalSeats),
      }));

      await Event.insertMany(eventsWithSeats);
      const newCount = await Event.countDocuments();

      console.log(`=========================================`);
      console.log(`✅ Successfully seeded ${newCount} events into MongoDB!`);
      console.log(`🏙️  Cities represented: 20 major Indian cities`);
      console.log(`🎭 Categories: Movies, Concerts, Sports, Comedy, Theatre, Cultural, Conferences, College, Family`);
      console.log(`=========================================`);
    } else {
      console.log(`ℹ️ Database already contains ${currentEventCount} events. Seed skipped.`);
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};

export default seedDatabaseIfEmpty;

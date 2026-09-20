import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Event from '../models/Event.js';
import generateSeats from '../utils/generateSeats.js';
import get100Events from './events100Data.js';
import { isAuthorizedAdminEmail } from '../config/adminConfig.js';

dotenv.config();

/**
 * Seed database with 100-event catalog and clean up any demo users.
 * NO DEFAULT USERS ARE SEEDED.
 */
export const seedDatabaseIfEmpty = async (force = false) => {
  try {
    // 1. Purge any leftover demo accounts
    await User.deleteMany({
      email: { $in: ['admin@example.com', 'user@example.com', 'admin@tixora.com', 'demo@gmail.com'] },
    });

    // 2. Ensure existing users have roles strictly matching the admin allowlist
    const existingUsers = await User.find({});
    for (const u of existingUsers) {
      const correctRole = isAuthorizedAdminEmail(u.email) ? 'admin' : 'user';
      if (u.role !== correctRole) {
        u.role = correctRole;
        await u.save();
      }
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

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
 * Generates multi-session show times for each event with independent seat inventories.
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

    // 3. Seed 100 Events across 20 Indian cities if fewer than 100 exist or lack shows / background
    const currentEventCount = await Event.countDocuments();
    const eventsWithoutBg = await Event.countDocuments({
      $or: [{ backgroundImage: { $exists: false } }, { backgroundImage: '' }],
    });
    const eventsWithoutShows = await Event.countDocuments({
      $or: [{ shows: { $exists: false } }, { 'shows.0': { $exists: false } }],
    });

    if (currentEventCount < 100 || eventsWithoutBg > 0 || eventsWithoutShows > 0 || force) {
      console.log(`=========================================`);
      console.log(
        `Seeding 100 events across 20 Indian cities... (Current count: ${currentEventCount}, without BG: ${eventsWithoutBg}, without Shows: ${eventsWithoutShows})`
      );

      if (force || currentEventCount > 0) {
        await Event.deleteMany({});
        console.log('Cleared existing events collection.');
      }

      const eventsList = get100Events();
      const showTimesByCat = {
        Movies: ['11:15 AM', '02:45 PM', '06:30 PM', '10:00 PM'],
        Concerts: ['05:30 PM', '08:00 PM'],
        Sports: ['03:30 PM', '07:30 PM'],
        Theatre: ['04:00 PM', '07:30 PM'],
        Comedy: ['06:00 PM', '09:00 PM'],
        default: ['11:00 AM', '03:00 PM', '07:00 PM'],
      };

      const eventsWithSeats = eventsList.map((evt) => {
        const baseSeats = generateSeats(evt.totalSeats);

        // Generate shows across 3 days: Today, Tomorrow, Day After
        const times = showTimesByCat[evt.category] || showTimesByCat.default;
        const shows = [];

        for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
          const showDate = new Date();
          showDate.setDate(showDate.getDate() + dayOffset);
          showDate.setHours(0, 0, 0, 0);

          times.forEach((t) => {
            shows.push({
              venue: evt.venue || evt.location,
              theatre: evt.theatre || (evt.category === 'Movies' ? 'Audi 1 (Dolby 7.1 ATMOS)' : 'Main Stage Arena'),
              city: evt.city || 'Mumbai',
              date: showDate,
              startTime: t,
              price: evt.price,
              totalSeats: evt.totalSeats || 60,
              availableSeats: evt.totalSeats || 60,
              seats: generateSeats(evt.totalSeats || 60),
            });
          });
        }

        return {
          ...evt,
          title: evt.name,
          startTime: evt.time,
          venue: evt.location,
          posterImage: evt.image,
          seats: baseSeats,
          shows,
        };
      });

      await Event.insertMany(eventsWithSeats);
      const newCount = await Event.countDocuments();

      console.log(`=========================================`);
      console.log(`✅ Successfully seeded ${newCount} events with multi-session show times into MongoDB!`);
      console.log(`🏙️  Cities represented: 20 major Indian cities`);
      console.log(`🎭 Categories: Movies, Concerts, Sports, Comedy, Theatre, Cultural, Conferences, College, Family`);
      console.log(`=========================================`);
    } else {
      console.log(`ℹ️ Database already contains ${currentEventCount} events with show sessions. Seed skipped.`);
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};

export default seedDatabaseIfEmpty;

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { Receiver } from '../models/Receiver.js';
import { Volunteer } from '../models/Volunteer.js';
import { Listing } from '../models/Listing.js';
import { Match } from '../models/Match.js';
import { Handover } from '../models/Handover.js';
import store, { createInitialData, registerPersistHooks } from '../data/store.js';
import { isConnected } from '../config/db.js';

export async function initDatabase() {
  if (!isConnected()) {
    console.log('ℹ️  [DB-Sync] In-memory mode active. Skipping MongoDB Atlas sync.');
    return;
  }

  // Register hooks to persist live mutations to Atlas
  registerPersistHooks({
    onListing: persistListing,
    onMatch: persistMatch,
    onHandover: persistHandover,
    onUser: persistUser,
    onRestaurant: persistRestaurant,
    onReceiver: persistReceiver,
    onVolunteer: persistVolunteer,
  });

  try {
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('🌱 [DB-Sync] MongoDB Atlas database is empty. Seeding initial FoodLoop records...');
      const initial = createInitialData();

      // Seed Users
      const userDocs = initial.users.map((u) => ({ ...u, customId: u.id }));
      await User.insertMany(userDocs);

      // Seed Restaurants
      const restDocs = initial.restaurants.map((r) => ({ ...r, customId: r.id }));
      await Restaurant.insertMany(restDocs);

      // Seed Receivers
      const recvDocs = initial.receivers.map((r) => ({ ...r, customId: r.id }));
      await Receiver.insertMany(recvDocs);

      // Seed Volunteers
      const volDocs = initial.volunteers.map((v) => ({ ...v, customId: v.id }));
      await Volunteer.insertMany(volDocs);

      // Seed Listings
      const listingDocs = initial.listings.map((l) => ({ ...l, customId: l.id }));
      await Listing.insertMany(listingDocs);

      // Seed Matches
      const matchDocs = initial.matches.map((m) => ({ ...m, customId: m.id }));
      await Match.insertMany(matchDocs);

      // Seed Handovers
      const handoverDocs = initial.handovers.map((h) => ({ ...h, customId: h.id }));
      await Handover.insertMany(handoverDocs);

      console.log('✅ [DB-Sync] Successfully populated MongoDB Atlas with all FoodLoop collections!');
    } else {
      console.log('📦 [DB-Sync] Atlas data detected. Hydrating in-memory store from MongoDB...');
      const [users, restaurants, receivers, volunteers, listings, matches, handovers] = await Promise.all([
        User.find().lean(),
        Restaurant.find().lean(),
        Receiver.find().lean(),
        Volunteer.find().lean(),
        Listing.find().lean(),
        Match.find().lean(),
        Handover.find().lean(),
      ]);

      store.data.users = users.map((u) => ({ ...u, id: u.customId || u.id || String(u._id) }));
      store.data.restaurants = restaurants.map((r) => ({ ...r, id: r.customId || r.id || String(r._id) }));
      store.data.receivers = receivers.map((r) => ({ ...r, id: r.customId || r.id || String(r._id) }));
      store.data.volunteers = volunteers.map((v) => ({ ...v, id: v.customId || v.id || String(v._id) }));
      store.data.listings = listings.map((l) => ({ ...l, id: l.customId || l.id || String(l._id) }));
      store.data.matches = matches.map((m) => ({ ...m, id: m.customId || m.id || String(m._id) }));
      store.data.handovers = handovers.map((h) => ({ ...h, id: h.customId || h.id || String(h._id) }));

      console.log(`✅ [DB-Sync] Loaded ${users.length} users, ${listings.length} listings, ${matches.length} matches from Atlas.`);
    }
  } catch (error) {
    console.error('❌ [DB-Sync] Error during database initialization:', error.message);
  }
}

// Background persistence helpers to ensure write durability in Atlas
export async function persistListing(listing) {
  if (!isConnected()) return;
  try {
    const id = listing.id || listing.customId;
    await Listing.findOneAndUpdate(
      { $or: [{ customId: id }, { id }] },
      { ...listing, customId: id },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[DB-Sync] Failed to persist listing:', err.message);
  }
}

export async function persistMatch(match) {
  if (!isConnected()) return;
  try {
    const id = match.id || match.customId;
    await Match.findOneAndUpdate(
      { $or: [{ customId: id }, { id }] },
      { ...match, customId: id },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[DB-Sync] Failed to persist match:', err.message);
  }
}

export async function persistHandover(handover) {
  if (!isConnected()) return;
  try {
    const id = handover.id || handover.customId;
    await Handover.findOneAndUpdate(
      { $or: [{ customId: id }, { id }] },
      { ...handover, customId: id },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[DB-Sync] Failed to persist handover:', err.message);
  }
}

export async function persistUser(user) {
  if (!isConnected()) return;
  try {
    const id = user.id || user.customId;
    await User.findOneAndUpdate(
      { $or: [{ customId: id }, { id }, { email: user.email }] },
      { ...user, customId: id },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[DB-Sync] Failed to persist user:', err.message);
  }
}

export async function persistRestaurant(restaurant) {
  if (!isConnected()) return;
  try {
    const id = restaurant.id || restaurant.customId;
    await Restaurant.findOneAndUpdate(
      { $or: [{ customId: id }, { id }] },
      { ...restaurant, customId: id },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[DB-Sync] Failed to persist restaurant:', err.message);
  }
}

export async function persistReceiver(receiver) {
  if (!isConnected()) return;
  try {
    const id = receiver.id || receiver.customId;
    await Receiver.findOneAndUpdate(
      { $or: [{ customId: id }, { id }] },
      { ...receiver, customId: id },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[DB-Sync] Failed to persist receiver:', err.message);
  }
}

export async function persistVolunteer(volunteer) {
  if (!isConnected()) return;
  try {
    const id = volunteer.id || volunteer.customId;
    await Volunteer.findOneAndUpdate(
      { $or: [{ customId: id }, { id }] },
      { ...volunteer, customId: id },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[DB-Sync] Failed to persist volunteer:', err.message);
  }
}

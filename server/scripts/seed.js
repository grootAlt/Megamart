// Usage: npm run seed   (requires MONGODB_URI; replaces all products)
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Cart } from '../src/models/Cart.js';
import { seedProducts } from './seedData.js';

if (!env.mongoUri) {
  console.error('Set MONGODB_URI first (see .env.example). Without it, `npm run dev` seeds an in-memory DB for you.');
  process.exit(1);
}

await connectDb(env.mongoUri);
const count = await seedProducts();
// Product ids change on reseed, so any existing cart lines would point nowhere.
await Cart.updateMany({}, { $set: { items: [] } });
console.log(`Seeded ${count} products`);
await mongoose.disconnect();

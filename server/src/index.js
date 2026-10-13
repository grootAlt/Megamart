import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { Product } from './models/Product.js';
import { seedProducts } from '../scripts/seedData.js';

async function main() {
  let uri = env.mongoUri;

  // No MONGODB_URI: start a throwaway in-memory MongoDB and seed it, so the
  // project runs with nothing but `npm install`. Data is lost on restart.
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri('megamart');
    console.log('MONGODB_URI not set, using an in-memory MongoDB (data resets on restart)');
  }

  await connectDb(uri);
  if ((await Product.estimatedDocumentCount()) === 0) {
    const count = await seedProducts();
    console.log(`Database was empty, seeded ${count} products`);
  }

  createApp().listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

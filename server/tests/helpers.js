import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDb } from '../src/config/db.js';
import { Product } from '../src/models/Product.js';

let mongod;
export const app = createApp();

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await connectDb(mongod.getUri('megamart-test'));
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}

export async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

let userSeq = 0;
export async function registerUser() {
  userSeq += 1;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: `Shopper ${userSeq}`, email: `shopper${userSeq}@example.com`, password: 'password123' })
    .expect(201);
  return res.body.data.token;
}

export async function createProduct({ stock = 5, price = 1000, mrp = 1500, name = 'Test Phone', sku = 'TST-01' } = {}) {
  return Product.create({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    category: 'mobiles',
    images: [],
    variants: [{ sku, size: '64 GB', color: 'Black', price, mrp, stock }],
  });
}

export const address = {
  fullName: 'Asha Kumar',
  phone: '9876543210',
  line1: '12 MG Road, Indiranagar',
  city: 'Bengaluru',
  pincode: '560038',
};

export function api(token) {
  const auth = (r) => r.set('Authorization', `Bearer ${token}`);
  return {
    get: (url) => auth(request(app).get(url)),
    post: (url, body) => auth(request(app).post(url)).send(body),
    patch: (url, body) => auth(request(app).patch(url)).send(body),
    delete: (url) => auth(request(app).delete(url)),
  };
}

export async function stockOf(productId) {
  const p = await Product.findById(productId).lean();
  return p.variants[0].stock;
}

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import { seedProducts } from '../scripts/seedData.js';
import { app, startDb, stopDb } from './helpers.js';

beforeAll(async () => {
  await startDb();
  await seedProducts();
});
afterAll(stopDb);

const list = (query) => request(app).get('/api/products').query(query);

describe('GET /api/products', () => {
  test('filters by category and price range, sorts and paginates on the server', async () => {
    const res = await list({ category: 'mobiles', minPrice: 10000, maxPrice: 40000, sort: 'price_asc', limit: 3 }).expect(200);
    const { data, meta } = res.body;

    expect(data).toHaveLength(3);
    expect(data.every((p) => p.category === 'mobiles' && p.price >= 10000 && p.price <= 40000)).toBe(true);
    expect(data.map((p) => p.price)).toEqual([...data.map((p) => p.price)].sort((a, b) => a - b));
    expect(meta).toMatchObject({ page: 1, limit: 3 });
    expect(meta.totalPages).toBe(Math.ceil(meta.total / 3));

    const page2 = (await list({ category: 'mobiles', minPrice: 10000, maxPrice: 40000, sort: 'price_asc', limit: 3, page: 2 })).body;
    const ids = new Set(data.map((p) => p.id));
    expect(page2.data.some((p) => ids.has(p.id))).toBe(false);
  });

  test('search matches product names', async () => {
    const { data } = (await list({ q: 'rolex' }).expect(200)).body;
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((p) => /rolex/i.test(p.name))).toBe(true);
  });

  test('bad query parameters are a 400 with the field named', async () => {
    const res = await list({ minPrice: 500, maxPrice: 100, sort: 'cheapest' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(['sort']));
  });

  test('brand filter and the brands summary agree with each other', async () => {
    const brands = (await request(app).get('/api/brands').query({ category: 'mobiles,electronics' }).expect(200)).body.data;
    const apple = brands.find((b) => b.name === 'Apple');
    expect(apple).toBeDefined();

    const { data, meta } = (await list({ brand: 'Apple', category: undefined, limit: 48 }).expect(200)).body;
    expect(data.every((p) => p.brand === 'Apple')).toBe(true);
    const electronicsOnly = data.filter((p) => ['mobiles', 'electronics'].includes(p.category));
    expect(electronicsOnly).toHaveLength(apple.productCount);
    expect(Math.max(...electronicsOnly.map((p) => p.discountPct))).toBeLessThanOrEqual(apple.maxDiscountPct);
    expect(meta.total).toBe(data.length);

    await request(app).get('/api/brands').query({ category: 'cars' }).expect(400);
  });

  test('product detail exposes variants with their own sku, price and stock', async () => {
    const { data } = (await request(app).get('/api/products/iphone-13-pro').expect(200)).body;
    expect(data.variants.length).toBeGreaterThan(1);
    for (const v of data.variants) expect(v).toEqual(expect.objectContaining({ sku: expect.any(String), price: expect.any(Number), stock: expect.any(Number) }));
    await request(app).get('/api/products/does-not-exist').expect(404);
  });
});

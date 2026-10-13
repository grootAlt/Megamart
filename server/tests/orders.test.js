import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { Order } from '../src/models/Order.js';
import { address, api, clearDb, createProduct, registerUser, startDb, stockOf, stopDb } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

function addToCart(client, product, quantity = 1) {
  return client.post('/api/cart/items', {
    productId: product._id.toString(),
    variantId: product.variants[0]._id.toString(),
    quantity,
  });
}

describe('order flow', () => {
  test('cart → order decrements stock, snapshots prices, empties the cart', async () => {
    const product = await createProduct({ stock: 5, price: 300, mrp: 400 });
    const client = api(await registerUser());

    await addToCart(client, product, 2).expect(201);
    const cart = (await client.get('/api/cart').expect(200)).body.data;
    // 2 × ₹300 = ₹600, which is over the free-shipping threshold.
    expect(cart.summary).toMatchObject({ subtotal: 600, shippingFee: 0, total: 600, savings: 200, canCheckout: true });

    const res = await client
      .post('/api/orders', { shippingAddress: address, expectedTotal: cart.summary.total })
      .expect(201);

    expect(res.body.data).toMatchObject({
      status: 'placed',
      total: 600,
      items: [{ sku: 'TST-01', price: 300, quantity: 2, lineTotal: 600 }],
    });
    expect(await stockOf(product._id)).toBe(3);

    const after = (await client.get('/api/cart').expect(200)).body.data;
    expect(after.items).toHaveLength(0);

    // The confirmation page can fetch it back; another user cannot.
    await client.get(`/api/orders/${res.body.data.id}`).expect(200);
    await api(await registerUser()).get(`/api/orders/${res.body.data.id}`).expect(404);
  });

  test('refuses to place an order when the total shown no longer matches', async () => {
    const product = await createProduct({ stock: 5, price: 300 });
    const client = api(await registerUser());
    await addToCart(client, product, 2).expect(201);

    const res = await client.post('/api/orders', { shippingAddress: address, expectedTotal: 500 }).expect(409);
    expect(res.body.error.code).toBe('PRICE_CHANGED');
    expect(await stockOf(product._id)).toBe(5);
  });

  test('rejects an invalid address with a 400 before touching anything', async () => {
    const product = await createProduct({ stock: 5 });
    const client = api(await registerUser());
    await addToCart(client, product).expect(201);

    const res = await client.post('/api/orders', { shippingAddress: { ...address, pincode: '12' } }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toMatchObject({ in: 'body', path: 'shippingAddress.pincode' });
    expect(await stockOf(product._id)).toBe(5);
  });
});

describe('overselling', () => {
  test('one unit left, two simultaneous checkouts: exactly one wins, stock never goes negative', async () => {
    const product = await createProduct({ stock: 1 });
    const buyers = [api(await registerUser()), api(await registerUser())];
    for (const b of buyers) await addToCart(b, product, 1).expect(201);

    const results = await Promise.all(buyers.map((b) => b.post('/api/orders', { shippingAddress: address })));
    const statuses = results.map((r) => r.status).sort();

    expect(statuses).toEqual([201, 409]);
    const loser = results.find((r) => r.status === 409);
    expect(['OUT_OF_STOCK', 'CART_HAS_ISSUES']).toContain(loser.body.error.code);
    expect(await stockOf(product._id)).toBe(0);
    expect(await Order.countDocuments()).toBe(1);
  });

  test('ten buyers racing for three units: three orders, stock lands at exactly 0', async () => {
    const product = await createProduct({ stock: 3 });
    const buyers = [];
    for (let i = 0; i < 10; i += 1) {
      const b = api(await registerUser());
      await addToCart(b, product, 1).expect(201);
      buyers.push(b);
    }

    const results = await Promise.all(buyers.map((b) => b.post('/api/orders', { shippingAddress: address })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 409)).toHaveLength(7);
    expect(await stockOf(product._id)).toBe(0);
  });

  test('a failed multi-item checkout puts back the stock it had already reserved', async () => {
    const plenty = await createProduct({ stock: 5, name: 'Plenty', sku: 'PLN-01' });
    const scarce = await createProduct({ stock: 1, name: 'Scarce', sku: 'SCR-01' });
    const winner = api(await registerUser());
    const loser = api(await registerUser());
    await addToCart(winner, scarce).expect(201);
    await addToCart(loser, plenty, 2).expect(201);
    await addToCart(loser, scarce).expect(201);

    const [w, l] = await Promise.all([
      winner.post('/api/orders', { shippingAddress: address }),
      loser.post('/api/orders', { shippingAddress: address }),
    ]);
    // Whichever request got there first, exactly one order includes the scarce item.
    const outcomes = [w.status, l.status].sort();
    expect(outcomes).toEqual([201, 409]);
    expect(await stockOf(scarce._id)).toBe(0);
    expect(await stockOf(plenty._id)).toBe(l.status === 201 ? 3 : 5);
  });
});

describe('stale carts', () => {
  test('an item that sells out while sitting in a cart is flagged, and checkout fails cleanly', async () => {
    const product = await createProduct({ stock: 2 });
    const slowShopper = api(await registerUser());
    const fastShopper = api(await registerUser());

    await addToCart(slowShopper, product, 2).expect(201);
    await addToCart(fastShopper, product, 2).expect(201);
    await fastShopper.post('/api/orders', { shippingAddress: address }).expect(201);

    // The cart says so before checkout is attempted...
    const cart = (await slowShopper.get('/api/cart').expect(200)).body.data;
    expect(cart.items[0]).toMatchObject({ status: 'out_of_stock', available: 0 });
    expect(cart.summary).toMatchObject({ canCheckout: false, issues: 1 });

    // ...and checkout still fails cleanly if attempted anyway.
    const res = await slowShopper.post('/api/orders', { shippingAddress: address }).expect(409);
    expect(res.body.error.code).toBe('CART_HAS_ISSUES');
    expect(res.body.error.details.cart.items[0].status).toBe('out_of_stock');
    expect(await stockOf(product._id)).toBe(0);
  });

  test('partially reduced stock asks the shopper to lower the quantity', async () => {
    const product = await createProduct({ stock: 3 });
    const a = api(await registerUser());
    const b = api(await registerUser());
    await addToCart(a, product, 3).expect(201);
    await addToCart(b, product, 2).expect(201);
    await b.post('/api/orders', { shippingAddress: address }).expect(201);

    const cart = (await a.get('/api/cart').expect(200)).body.data;
    expect(cart.items[0]).toMatchObject({ status: 'insufficient_stock', available: 1 });

    const lineId = cart.items[0].id;
    await a.patch(`/api/cart/items/${lineId}`, { quantity: 2 }).expect(409);
    const fixed = (await a.patch(`/api/cart/items/${lineId}`, { quantity: 1 }).expect(200)).body.data;
    expect(fixed.summary.canCheckout).toBe(true);
  });
});

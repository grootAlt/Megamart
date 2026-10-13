import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { hydrateCart } from './cartService.js';
import { computeTotals } from './pricing.js';

/**
 * Turns the user's cart into an order.
 *
 * Overselling is prevented by the stock decrement itself, not by a read
 * beforehand. Each line runs one atomic findOneAndUpdate whose filter says
 * "this variant has at least `quantity` in stock". MongoDB evaluates that
 * filter and applies the $inc as a single operation on the document, so of
 * two concurrent checkouts for the last unit exactly one matches. The other
 * gets null back and fails cleanly. Stock can't go below zero, because a
 * decrement that would take it there never matches.
 *
 * An order with several lines reserves them one by one. If line N can't be
 * reserved, lines 1..N-1 are put back (compensating $inc) before returning a
 * 409, so a failed checkout leaves stock exactly as it found it.
 */
export async function placeOrder(userId, { shippingAddress, expectedTotal }) {
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('CART_EMPTY', 'Your cart is empty');
  }

  // Cheap pre-check so a cart we already know is stale fails with a helpful
  // message, without touching stock.
  const current = await hydrateCart(cart);
  if (!current.summary.canCheckout) {
    throw ApiError.conflict('CART_HAS_ISSUES', 'Some items in your cart are no longer available', {
      cart: current,
    });
  }
  if (expectedTotal !== undefined && expectedTotal !== current.summary.total) {
    throw ApiError.conflict('PRICE_CHANGED', 'Prices in your cart have changed. Please review your order.', {
      cart: current,
    });
  }

  const reserved = [];
  try {
    for (const line of cart.items) {
      const product = await Product.findOneAndUpdate(
        {
          _id: line.product,
          variants: { $elemMatch: { _id: line.variantId, stock: { $gte: line.quantity } } },
        },
        { $inc: { 'variants.$.stock': -line.quantity } },
        { returnDocument: 'after' },
      ).lean();

      if (!product) {
        throw ApiError.conflict('OUT_OF_STOCK', 'An item in your cart just sold out', {
          variantId: line.variantId.toString(),
        });
      }
      reserved.push({ line, product });
    }

    const items = reserved.map(({ line, product }) => {
      const variant = product.variants.find((v) => v._id.equals(line.variantId));
      return {
        product: product._id,
        variantId: variant._id,
        sku: variant.sku,
        name: product.name,
        image: product.images[0],
        size: variant.size,
        color: variant.color,
        price: variant.price,
        mrp: variant.mrp,
        quantity: line.quantity,
        lineTotal: variant.price * line.quantity,
      };
    });

    // Recompute from the documents we actually decremented. If a price
    // changed between the pre-check and the reservation, refuse rather than
    // charge an amount the customer never saw.
    const totals = computeTotals(items);
    if (expectedTotal !== undefined && expectedTotal !== totals.total) {
      throw ApiError.conflict('PRICE_CHANGED', 'Prices in your cart have changed. Please review your order.');
    }

    const order = await Order.create({
      user: userId,
      items,
      subtotal: totals.subtotal,
      savings: totals.savings,
      shippingFee: totals.shippingFee,
      total: totals.total,
      shippingAddress,
    });

    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
    return toOrderDto(order.toObject());
  } catch (err) {
    await releaseStock(reserved);
    // Send back the fresh cart so the client can show which line failed.
    if (err instanceof ApiError && err.status === 409) {
      err.details = { ...err.details, cart: await hydrateCart(cart) };
    }
    throw err;
  }
}

async function releaseStock(reserved) {
  await Promise.all(
    reserved.map(({ line }) =>
      Product.updateOne(
        { _id: line.product, 'variants._id': line.variantId },
        { $inc: { 'variants.$.stock': line.quantity } },
      ),
    ),
  );
}

export async function getOrder(userId, orderId) {
  // Scoped by user, so one customer can't read another's order by guessing ids.
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) throw ApiError.notFound('Order not found');
  return toOrderDto(order);
}

export async function listOrders(userId) {
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
  return orders.map(toOrderDto);
}

function toOrderDto(o) {
  return {
    id: o._id.toString(),
    status: o.status,
    items: o.items.map((i) => ({
      productId: i.product.toString(),
      variantId: i.variantId.toString(),
      sku: i.sku,
      name: i.name,
      image: i.image ?? null,
      size: i.size ?? null,
      color: i.color ?? null,
      price: i.price,
      mrp: i.mrp,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    subtotal: o.subtotal,
    savings: o.savings,
    shippingFee: o.shippingFee,
    total: o.total,
    shippingAddress: o.shippingAddress,
    createdAt: o.createdAt,
  };
}

import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { MAX_LINE_QTY } from '../validation/schemas.js';
import { computeTotals, FREE_SHIPPING_THRESHOLD } from './pricing.js';

// Line statuses. Anything other than OK blocks checkout, and the cart screen
// shows the message next to the line.
export const LINE_STATUS = {
  OK: 'ok',
  INSUFFICIENT: 'insufficient_stock',
  OUT_OF_STOCK: 'out_of_stock',
  UNAVAILABLE: 'unavailable',
};

async function findOrCreateCart(userId) {
  // Upsert so two first-time adds racing each other can't create two carts.
  return Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, returnDocument: 'after' },
  );
}

async function loadVariant(productId, variantId) {
  const product = await Product.findById(productId).lean();
  if (!product) throw ApiError.notFound('Product not found');
  const variant = product.variants.find((v) => v._id.equals(variantId));
  if (!variant) throw ApiError.notFound('That option is no longer available');
  return { product, variant };
}

function assertStock(variant, quantity, alreadyInCart = 0) {
  if (variant.stock === 0) {
    throw ApiError.conflict('OUT_OF_STOCK', 'This item is out of stock', { available: 0 });
  }
  if (quantity > variant.stock) {
    const message =
      alreadyInCart > 0
        ? `Only ${variant.stock} left and you already have ${alreadyInCart} in your cart`
        : `Only ${variant.stock} left in stock`;
    throw ApiError.conflict('INSUFFICIENT_STOCK', message, { available: variant.stock });
  }
}

// Joins cart lines with live product data and works out, per line, whether
// it can still be bought. This is what makes stale carts visible before
// checkout: a line whose stock dropped comes back flagged.
export async function hydrateCart(cart) {
  const items = cart?.items ?? [];
  const productIds = [...new Set(items.map((i) => i.product.toString()))];
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines = items.map((item) => {
    const product = byId.get(item.product.toString());
    const variant = product?.variants.find((v) => v._id.equals(item.variantId));
    const base = { id: item._id.toString(), quantity: item.quantity };

    if (!product || !variant) {
      return {
        ...base,
        productId: item.product.toString(),
        variantId: item.variantId.toString(),
        name: product?.name ?? 'Item no longer available',
        price: 0,
        mrp: 0,
        available: 0,
        lineTotal: 0,
        status: LINE_STATUS.UNAVAILABLE,
        message: 'This item is no longer sold. Remove it to continue.',
      };
    }

    let status = LINE_STATUS.OK;
    let message = null;
    if (variant.stock === 0) {
      status = LINE_STATUS.OUT_OF_STOCK;
      message = 'Out of stock. Remove it to continue.';
    } else if (variant.stock < item.quantity) {
      status = LINE_STATUS.INSUFFICIENT;
      message = `Only ${variant.stock} left. Reduce the quantity to continue.`;
    }

    return {
      ...base,
      productId: product._id.toString(),
      variantId: variant._id.toString(),
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0] ?? null,
      sku: variant.sku,
      size: variant.size ?? null,
      color: variant.color ?? null,
      price: variant.price,
      mrp: variant.mrp,
      available: variant.stock,
      maxQuantity: Math.min(variant.stock, MAX_LINE_QTY),
      lineTotal: variant.price * item.quantity,
      status,
      message,
    };
  });

  const issues = lines.filter((l) => l.status !== LINE_STATUS.OK).length;
  return {
    items: lines,
    summary: {
      // Lines that can't be bought at all don't count towards the total; the
      // shopper sees what they'd pay once they remove them.
      ...computeTotals(
        lines.filter((l) => l.status !== LINE_STATUS.UNAVAILABLE && l.status !== LINE_STATUS.OUT_OF_STOCK),
      ),
      issues,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      canCheckout: lines.length > 0 && issues === 0,
    },
  };
}

export async function getCart(userId) {
  const cart = await Cart.findOne({ user: userId }).lean();
  return hydrateCart(cart);
}

export async function addItem(userId, { productId, variantId, quantity }) {
  const { variant } = await loadVariant(productId, variantId);
  const cart = await findOrCreateCart(userId);
  const existing = cart.items.find((i) => i.variantId.equals(variantId));
  const inCart = existing?.quantity ?? 0;
  const next = inCart + quantity;

  if (next > MAX_LINE_QTY) {
    throw ApiError.conflict('QUANTITY_LIMIT', `You can buy at most ${MAX_LINE_QTY} of this item`, {
      max: MAX_LINE_QTY,
    });
  }
  assertStock(variant, next, inCart);

  if (existing) existing.quantity = next;
  else cart.items.push({ product: productId, variantId, quantity });
  await cart.save();
  return hydrateCart(cart);
}

export async function updateItem(userId, itemId, quantity) {
  const cart = await Cart.findOne({ user: userId });
  const line = cart?.items.id(itemId);
  if (!line) throw ApiError.notFound('Cart item not found');

  const { variant } = await loadVariant(line.product, line.variantId);
  assertStock(variant, quantity);

  line.quantity = quantity;
  await cart.save();
  return hydrateCart(cart);
}

export async function removeItem(userId, itemId) {
  const cart = await Cart.findOne({ user: userId });
  const line = cart?.items.id(itemId);
  if (!line) throw ApiError.notFound('Cart item not found');
  line.deleteOne();
  await cart.save();
  return hydrateCart(cart);
}

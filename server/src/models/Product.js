import mongoose from 'mongoose';
import { CATEGORY_SLUGS } from '../config/categories.js';

// Money is stored as integer rupees everywhere, so totals never pick up
// floating point drift between client and server.
const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true },
  size: { type: String, trim: true },
  color: { type: String, trim: true },
  colorHex: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  // `min: 0` only guards document saves. Checkout decrements with an atomic
  // conditional update (see services/orderService.js), which is what actually
  // keeps this from going negative.
  stock: { type: Number, required: true, min: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, trim: true },
    category: { type: String, required: true, enum: CATEGORY_SLUGS },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    variants: {
      type: [variantSchema],
      validate: [(v) => v.length > 0, 'A product needs at least one variant'],
    },
    // Denormalised from variants so listing filters and sorts can use an index.
    // A product's listing price is its cheapest variant ("from ₹X").
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    maxDiscountPct: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.pre('validate', function deriveFromVariants() {
  if (!this.variants?.length) return;
  const prices = this.variants.map((v) => v.price);
  this.minPrice = Math.min(...prices);
  this.maxPrice = Math.max(...prices);
  this.maxDiscountPct = Math.max(...this.variants.map(discountPct));
});

export function discountPct(variant) {
  return variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0;
}

// Listing: filter by category + price, sort by price / newest / discount.
productSchema.index({ category: 1, minPrice: 1 });
productSchema.index({ brand: 1, minPrice: 1 });
productSchema.index({ minPrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ maxDiscountPct: -1 });
productSchema.index({ 'variants.sku': 1 }, { unique: true });
productSchema.index(
  { name: 'text', brand: 'text', description: 'text' },
  { weights: { name: 10, brand: 5, description: 1 }, name: 'product_search' },
);

export const Product = mongoose.model('Product', productSchema);

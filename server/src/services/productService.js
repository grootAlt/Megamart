import { CATEGORIES } from '../config/categories.js';
import { Product, discountPct } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

const SORT_SPECS = {
  price_asc: { minPrice: 1, _id: 1 },
  price_desc: { minPrice: -1, _id: 1 },
  newest: { createdAt: -1, _id: -1 },
  discount: { maxDiscountPct: -1, _id: 1 },
};

export async function listProducts({ category, brand, minPrice, maxPrice, sort, q, page, limit }) {
  const filter = {};
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.minPrice = {};
    if (minPrice !== undefined) filter.minPrice.$gte = minPrice;
    if (maxPrice !== undefined) filter.minPrice.$lte = maxPrice;
  }

  let projection;
  let sortSpec = SORT_SPECS[sort];
  if (q) {
    filter.$text = { $search: q };
    projection = { score: { $meta: 'textScore' } };
    if (sort === 'relevance') sortSpec = { score: { $meta: 'textScore' }, _id: 1 };
  }
  // Without a search term "relevance" means our featured order: best deals first.
  sortSpec ??= SORT_SPECS.discount;

  const [docs, total] = await Promise.all([
    Product.find(filter, projection)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    data: docs.map(toListItem),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getProductBySlug(slug) {
  const doc = await Product.findOne({ slug }).lean();
  if (!doc) throw ApiError.notFound('Product not found');
  return toDetail(doc);
}

export async function listCategories() {
  const stats = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, maxDiscountPct: { $max: '$maxDiscountPct' } } },
  ]);
  const byId = Object.fromEntries(stats.map((s) => [s._id, s]));
  return CATEGORIES.map((c) => ({
    ...c,
    productCount: byId[c.slug]?.count ?? 0,
    maxDiscountPct: byId[c.slug]?.maxDiscountPct ?? 0,
  }));
}

// Brands within some categories, with the best deal each one has, so the
// "UP to X% OFF" on the home page brand cards is a real number.
export async function listBrands({ categories, limit }) {
  const match = categories?.length ? { category: { $in: categories } } : {};
  const rows = await Product.aggregate([
    { $match: { ...match, brand: { $type: 'string', $ne: '' } } },
    { $sort: { maxDiscountPct: -1, _id: 1 } },
    {
      $group: {
        _id: '$brand',
        productCount: { $sum: 1 },
        maxDiscountPct: { $max: '$maxDiscountPct' },
        image: { $first: { $arrayElemAt: ['$images', 0] } },
      },
    },
    { $sort: { productCount: -1, maxDiscountPct: -1, _id: 1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({
    name: r._id,
    productCount: r.productCount,
    maxDiscountPct: r.maxDiscountPct,
    image: r.image ?? null,
  }));
}

function cheapestVariant(variants) {
  return variants.reduce((best, v) => (v.price < best.price ? v : best), variants[0]);
}

export function toListItem(p) {
  const v = cheapestVariant(p.variants);
  return {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    image: p.images[0] ?? null,
    price: v.price,
    mrp: v.mrp,
    discountPct: discountPct(v),
    hasPriceRange: p.minPrice !== p.maxPrice,
    inStock: p.variants.some((x) => x.stock > 0),
  };
}

export function toDetail(p) {
  return {
    ...toListItem(p),
    description: p.description,
    images: p.images,
    variants: p.variants.map((v) => ({
      id: v._id.toString(),
      sku: v.sku,
      size: v.size ?? null,
      color: v.color ?? null,
      colorHex: v.colorHex ?? null,
      price: v.price,
      mrp: v.mrp,
      discountPct: discountPct(v),
      stock: v.stock,
    })),
  };
}

import { z } from 'zod';
import { CATEGORY_SLUGS } from '../config/categories.js';

// Every request shape the API accepts lives in this file. Routes declare which
// schema applies via the `validate` middleware; handlers read `req.valid`.

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid id');
const rupees = z.coerce.number().int().min(0).max(10_000_000);
export const MAX_LINE_QTY = 10;

export const SORTS = ['relevance', 'price_asc', 'price_desc', 'newest', 'discount'];

export const productListQuery = z
  .object({
    category: z.enum(CATEGORY_SLUGS).optional(),
    brand: z.string().trim().min(1).max(60).optional(),
    minPrice: rupees.optional(),
    maxPrice: rupees.optional(),
    sort: z.enum(SORTS).default('relevance'),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  });

export const brandListQuery = z.object({
  // Comma-separated category slugs, e.g. ?category=mobiles,electronics
  category: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : undefined))
    .pipe(z.array(z.enum(CATEGORY_SLUGS)).optional()),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const slugParams = z.object({ slug: z.string().trim().min(1).max(200) });
export const idParams = z.object({ id: objectId });

export const register = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60),
  email: z.email('Enter a valid email').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const login = z.object({
  email: z.email('Enter a valid email').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const addCartItem = z.object({
  productId: objectId,
  variantId: objectId,
  quantity: z.number().int().min(1).max(MAX_LINE_QTY).default(1),
});

export const updateCartItem = z.object({
  quantity: z.number().int().min(1).max(MAX_LINE_QTY),
});

export const createOrder = z.object({
  shippingAddress: z.object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(80),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number'),
    line1: z.string().trim().min(5, 'Enter your address').max(200),
    city: z.string().trim().min(2, 'Enter your city').max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit pincode'),
  }),
  // The total the customer was shown. If prices moved since, refuse rather
  // than charge a different amount than the one on screen.
  expectedTotal: z.number().int().min(0).optional(),
});

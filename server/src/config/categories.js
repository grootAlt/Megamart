// Categories are a fixed, small set for this slice, so they live in code rather
// than in their own collection. Products store the slug.
export const CATEGORIES = [
  { slug: 'mobiles', name: 'Mobiles' },
  { slug: 'electronics', name: 'Electronics' },
  { slug: 'watches', name: 'Watches' },
  { slug: 'fashion', name: 'Fashion' },
  { slug: 'beauty', name: 'Beauty' },
  { slug: 'furniture', name: 'Furniture' },
  { slug: 'groceries', name: 'Groceries' },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

import { Product } from '../src/models/Product.js';

// ~34 products across 7 categories, priced from ₹129 to ₹9.5 lakh so the price
// filter and sorts have something to chew on. A few are set up on purpose to
// exercise edge cases:
//   - Realme C35 (4GB · 64GB, Glowing Black) has exactly 1 unit, for trying
//     the oversell race by hand.
//   - Rolex Submariner is fully out of stock.
//   - Several products have individual variants at 0 stock.
// Images are served from the public dummyjson CDN.

const IMG = 'https://cdn.dummyjson.com/product-images';
const images = (path, count) => Array.from({ length: count }, (_, i) => `${IMG}/${path}/${i + 1}.webp`);
const v = (size, color, colorHex, price, mrp, stock) => ({ size, color, colorHex, price, mrp, stock });

const COLORS = {
  black: ['Black', '#1f1f1f'],
  graphite: ['Graphite', '#4a4a4f'],
  silver: ['Silver', '#d9d9de'],
  gold: ['Gold', '#e8d3a9'],
  blue: ['Blue', '#2b5fae'],
  green: ['Green', '#2f6b4f'],
  white: ['White', '#f4f4f4'],
  red: ['Red', '#c62828'],
  brown: ['Brown', '#7a4b2a'],
  grey: ['Grey', '#8a8d91'],
  navy: ['Navy', '#1f2a44'],
  beige: ['Beige', '#d8c3a5'],
};
const c = (key) => COLORS[key];

const PRODUCTS = [
  // ---- Mobiles: size = RAM/storage, colour = finish
  {
    name: 'iPhone 13 Pro', brand: 'Apple', category: 'mobiles', images: images('smartphones/iphone-13-pro', 3),
    description: 'Super Retina XDR display with ProMotion, A15 Bionic chip and a pro triple-camera system with macro photography.',
    variants: [
      v('128 GB', ...c('graphite'), 99900, 119900, 6), v('256 GB', ...c('graphite'), 109900, 129900, 3),
      v('128 GB', ...c('gold'), 99900, 119900, 0), v('256 GB', ...c('gold'), 109900, 129900, 4),
    ],
  },
  {
    name: 'iPhone X', brand: 'Apple', category: 'mobiles', images: images('smartphones/iphone-x', 3),
    description: 'The iPhone that started the all-screen design, with Face ID and a 5.8-inch Super Retina display.',
    variants: [v('64 GB', ...c('silver'), 32999, 49999, 5), v('256 GB', ...c('silver'), 38999, 57999, 2)],
  },
  {
    name: 'Samsung Galaxy S10', brand: 'Samsung', category: 'mobiles', images: images('smartphones/samsung-galaxy-s10', 3),
    description: 'Dynamic AMOLED Infinity-O display, ultrasonic in-display fingerprint sensor and triple rear camera.',
    variants: [
      v('8GB · 128GB', ...c('black'), 32999, 74999, 8), v('8GB · 128GB', ...c('blue'), 32999, 74999, 4),
      v('8GB · 512GB', ...c('black'), 39999, 84999, 2),
    ],
  },
  {
    name: 'Samsung Galaxy S8', brand: 'Samsung', category: 'mobiles', images: images('smartphones/samsung-galaxy-s8', 3),
    description: 'Curved Infinity display, IP68 water resistance and a dual-pixel 12MP camera.',
    variants: [v('4GB · 64GB', ...c('black'), 10499, 14999, 12), v('4GB · 64GB', ...c('silver'), 10499, 14999, 6)],
  },
  {
    name: 'Oppo F19 Pro Plus', brand: 'Oppo', category: 'mobiles', images: images('smartphones/oppo-f19-pro-plus', 3),
    description: '5G ready, 50W Flash Charge and a 48MP quad camera with AI night portrait.',
    variants: [v('8GB · 128GB', ...c('silver'), 24999, 29990, 10), v('8GB · 128GB', ...c('black'), 24999, 29990, 0)],
  },
  {
    name: 'Realme XT', brand: 'Realme', category: 'mobiles', images: images('smartphones/realme-xt', 3),
    description: '64MP quad camera, Super AMOLED display and VOOC Flash Charge 3.0.',
    variants: [
      v('4GB · 64GB', ...c('blue'), 13999, 16999, 9), v('6GB · 64GB', ...c('blue'), 14999, 17999, 7),
      v('8GB · 128GB', ...c('white'), 16999, 19999, 3),
    ],
  },
  {
    name: 'Vivo X21', brand: 'Vivo', category: 'mobiles', images: images('smartphones/vivo-x21', 3),
    description: 'In-display fingerprint scanning, 6.28-inch Super AMOLED and dual-pixel AI camera.',
    variants: [v('6GB · 128GB', ...c('black'), 16999, 24999, 6)],
  },
  {
    name: 'Realme C35', brand: 'Realme', category: 'mobiles', images: images('smartphones/realme-c35', 3),
    description: '50MP AI triple camera, 5000mAh battery and an FHD+ display. Great value everyday phone.',
    variants: [
      v('4GB · 64GB', 'Glowing Black', '#1f1f1f', 11999, 13999, 1),
      v('4GB · 128GB', 'Glowing Green', '#3f7f5f', 12999, 14999, 5),
    ],
  },

  // ---- Electronics: laptops and tablets
  {
    name: 'Apple MacBook Pro 14 Inch Space Grey', brand: 'Apple', category: 'electronics',
    images: images('laptops/apple-macbook-pro-14-inch-space-grey', 3),
    description: 'M-series chip, Liquid Retina XDR display and up to 18 hours of battery life.',
    variants: [v('16GB · 512GB', ...c('grey'), 169900, 199900, 4), v('16GB · 1TB', ...c('grey'), 189900, 219900, 2)],
  },
  {
    name: 'Asus Zenbook Pro Dual Screen Laptop', brand: 'Asus', category: 'electronics',
    images: images('laptops/asus-zenbook-pro-dual-screen-laptop', 3),
    description: 'ScreenPad Plus secondary display, OLED main screen and RTX graphics for creators.',
    variants: [v('16GB · 1TB', ...c('navy'), 149990, 179990, 3)],
  },
  {
    name: 'New DELL XPS 13 9300 Laptop', brand: 'Dell', category: 'electronics',
    images: images('laptops/new-dell-xps-13-9300-laptop', 3),
    description: 'InfinityEdge 13.4-inch display in a compact aluminium and carbon-fibre body.',
    variants: [v('8GB · 512GB', ...c('silver'), 109990, 134990, 5), v('16GB · 1TB', ...c('silver'), 129990, 154990, 0)],
  },
  {
    name: 'Lenovo Yoga 920', brand: 'Lenovo', category: 'electronics', images: images('laptops/lenovo-yoga-920', 3),
    description: '2-in-1 convertible with a 360° watchband hinge, active pen support and 4K touch display.',
    variants: [v('8GB · 256GB', ...c('silver'), 79990, 99990, 6), v('16GB · 512GB', ...c('silver'), 94990, 114990, 3)],
  },
  {
    name: 'iPad Mini 2021 Starlight', brand: 'Apple', category: 'electronics',
    images: images('tablets/ipad-mini-2021-starlight', 4),
    description: '8.3-inch Liquid Retina display, A15 Bionic and USB-C. Small enough for one hand.',
    variants: [v('64 GB', 'Starlight', '#efe6d8', 46900, 49900, 7), v('256 GB', 'Starlight', '#efe6d8', 60900, 64900, 4)],
  },
  {
    name: 'Samsung Galaxy Tab S8 Plus Grey', brand: 'Samsung', category: 'electronics',
    images: images('tablets/samsung-galaxy-tab-s8-plus-grey', 4),
    description: '12.4-inch Super AMOLED, S Pen in the box and Snapdragon 8 Gen 1.',
    variants: [v('8GB · 128GB', ...c('graphite'), 74999, 89999, 5)],
  },

  // ---- Watches: colour only
  {
    name: 'Brown Leather Belt Watch', brand: 'Fashion Timepieces', category: 'watches',
    images: images('mens-watches/brown-leather-belt-watch', 3),
    description: 'Classic analog watch with a genuine leather strap and mineral glass dial.',
    variants: [v(null, ...c('brown'), 1499, 2999, 25), v(null, ...c('black'), 1499, 2999, 18)],
  },
  {
    name: 'Longines Master Collection', brand: 'Longines', category: 'watches',
    images: images('mens-watches/longines-master-collection', 3),
    description: 'Self-winding mechanical movement, moon phase complication and sapphire crystal.',
    variants: [v(null, ...c('silver'), 189000, 210000, 2)],
  },
  {
    name: 'Rolex Datejust', brand: 'Rolex', category: 'watches', images: images('mens-watches/rolex-datejust', 3),
    description: 'The archetype of the classic watch, with Cyclops date lens and fluted bezel.',
    variants: [v('36 mm', ...c('silver'), 849000, 899000, 1), v('41 mm', ...c('silver'), 949000, 999000, 1)],
  },
  {
    name: 'Rolex Submariner Watch', brand: 'Rolex', category: 'watches',
    images: images('mens-watches/rolex-submariner-watch', 3),
    description: 'Divers’ reference since 1953. Waterproof to 300 metres with a unidirectional rotatable bezel.',
    variants: [v(null, ...c('black'), 899000, 949000, 0), v(null, ...c('green'), 929000, 979000, 0)],
  },

  // ---- Fashion: size × colour grids
  {
    name: 'Blue & Black Check Shirt', brand: 'Fashion Trends', category: 'fashion',
    images: images('mens-shirts/blue-&-black-check-shirt', 4),
    description: 'Soft brushed-cotton flannel shirt in a classic buffalo check. Regular fit.',
    variants: ['S', 'M', 'L', 'XL'].map((s, i) => v(s, ...c('blue'), 799, 1599, [4, 10, 0, 3][i])),
  },
  {
    name: 'Man Plaid Shirt', brand: 'Classic Wear', category: 'fashion', images: images('mens-shirts/man-plaid-shirt', 4),
    description: 'Lightweight plaid shirt with a button-down collar for everyday wear.',
    variants: [
      ...['M', 'L', 'XL'].map((s, i) => v(s, ...c('red'), 899, 1499, [6, 8, 2][i])),
      ...['M', 'L', 'XL'].map((s, i) => v(s, ...c('navy'), 899, 1499, [0, 5, 4][i])),
    ],
  },
  {
    name: 'Gigabyte Aorus Men Tshirt', brand: 'Gigabyte', category: 'fashion',
    images: images('mens-shirts/gigabyte-aorus-men-tshirt', 4),
    description: 'Breathable cotton gaming tee with the AORUS eagle print.',
    variants: ['S', 'M', 'L', 'XL', 'XXL'].map((s, i) => v(s, ...c('black'), 499, 999, [9, 14, 12, 6, 0][i])),
  },
  {
    name: 'Nike Air Jordan 1 Red And Black', brand: 'Nike', category: 'fashion',
    images: images('mens-shoes/nike-air-jordan-1-red-and-black', 4),
    description: 'The original high-top that started it all, in the iconic Bred colourway.',
    variants: ['UK 7', 'UK 8', 'UK 9', 'UK 10'].map((s, i) => v(s, ...c('red'), 13995, 16995, [2, 3, 1, 0][i])),
  },
  {
    name: 'Puma Future Rider Trainers', brand: 'Puma', category: 'fashion',
    images: images('mens-shoes/puma-future-rider-trainers', 4),
    description: 'Retro running-inspired trainers with a lightweight EVA midsole.',
    variants: [
      ...['UK 7', 'UK 8', 'UK 9'].map((s, i) => v(s, ...c('white'), 3499, 6999, [5, 7, 4][i])),
      ...['UK 8', 'UK 9'].map((s, i) => v(s, ...c('black'), 3699, 6999, [3, 0][i])),
    ],
  },

  // ---- Beauty
  {
    name: 'Essence Mascara Lash Princess', brand: 'Essence', category: 'beauty',
    images: images('beauty/essence-mascara-lash-princess', 1),
    description: 'Volumising and lengthening mascara with a conic fibre brush. Cruelty free.',
    variants: [v('12 ml', ...c('black'), 349, 399, 40)],
  },
  {
    name: 'Eyeshadow Palette with Mirror', brand: 'Glamour Beauty', category: 'beauty',
    images: images('beauty/eyeshadow-palette-with-mirror', 1),
    description: 'Twelve blendable matte and shimmer shades in a travel-friendly case with mirror.',
    variants: [v(null, 'Nude', '#c9a088', 899, 1299, 15), v(null, 'Smoky', '#5a4b4b', 899, 1299, 9)],
  },
  {
    name: 'Red Lipstick', brand: 'Chic Cosmetics', category: 'beauty', images: images('beauty/red-lipstick', 1),
    description: 'Long-wearing creamy matte lipstick enriched with vitamin E.',
    variants: [v(null, 'Ruby', '#9b111e', 499, 699, 20), v(null, 'Crimson', '#b0182c', 499, 699, 0), v(null, 'Coral', '#e5585a', 499, 699, 11)],
  },
  {
    name: 'Red Nail Polish', brand: 'Nail Couture', category: 'beauty', images: images('beauty/red-nail-polish', 1),
    description: 'Chip-resistant gloss finish that dries in 60 seconds.',
    variants: [v('9 ml', ...c('red'), 199, 299, 30)],
  },

  // ---- Furniture
  {
    name: 'Annibale Colombo Sofa', brand: 'Annibale Colombo', category: 'furniture',
    images: images('furniture/annibale-colombo-sofa', 3),
    description: 'Hand-finished three-seater with feather-blend cushions and solid walnut legs.',
    variants: [v('3 seater', ...c('beige'), 189999, 249999, 2), v('3 seater', ...c('grey'), 189999, 249999, 1)],
  },
  {
    name: 'Bedside Table African Cherry', brand: 'Furniture Co.', category: 'furniture',
    images: images('furniture/bedside-table-african-cherry', 3),
    description: 'Solid African cherry wood nightstand with a soft-close drawer.',
    variants: [v(null, 'Cherry', '#7b3f2b', 18999, 24999, 6)],
  },
  {
    name: 'Knoll Saarinen Executive Conference Chair', brand: 'Knoll', category: 'furniture',
    images: images('furniture/knoll-saarinen-executive-conference-chair', 3),
    description: 'Mid-century modern classic with a moulded shell and swivel base.',
    variants: [v(null, ...c('black'), 38999, 49999, 4), v(null, ...c('white'), 38999, 49999, 2)],
  },

  // ---- Groceries: size = pack size
  {
    name: 'Fresh Apples', brand: 'MegaMart Fresh', category: 'groceries', images: images('groceries/apple', 1),
    description: 'Crisp, juicy Shimla apples. Sourced fresh every morning.',
    variants: [v('500 g', null, null, 129, 159, 50), v('1 kg', null, null, 239, 299, 30)],
  },
  {
    name: 'Farm Fresh Eggs', brand: 'MegaMart Fresh', category: 'groceries', images: images('groceries/eggs', 1),
    description: 'Free-range brown eggs, rich in protein.',
    variants: [v('6 pcs', null, null, 69, 84, 40), v('12 pcs', null, null, 129, 159, 25)],
  },
  {
    name: 'Cold Pressed Cooking Oil', brand: 'MegaMart Pantry', category: 'groceries', images: images('groceries/cooking-oil', 1),
    description: 'Cold-pressed groundnut oil with a light, nutty flavour.',
    variants: [v('1 L', null, null, 249, 299, 35), v('5 L', null, null, 1149, 1399, 10)],
  },
  {
    name: 'Strawberries', brand: 'MegaMart Fresh', category: 'groceries', images: images('groceries/strawberry', 1),
    description: 'Sweet Mahabaleshwar strawberries, hand picked.',
    variants: [v('200 g', null, null, 149, 199, 0), v('400 g', null, null, 279, 349, 8)],
  },
  {
    name: 'Wild Forest Honey', brand: 'MegaMart Pantry', category: 'groceries', images: images('groceries/honey-jar', 1),
    description: 'Raw, unprocessed honey from forest beehives.',
    variants: [v('250 g', null, null, 199, 249, 22), v('500 g', null, null, 369, 449, 14)],
  },
];

function slugify(s) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function buildSeedProducts() {
  // Stagger createdAt so "newest" sorting is deterministic.
  const base = Date.UTC(2026, 8, 1);
  return PRODUCTS.map((p, i) => {
    const slug = slugify(p.name);
    const prefix = slug.split('-').slice(0, 3).map((w) => w.slice(0, 3).toUpperCase()).join('');
    return {
      ...p,
      slug,
      createdAt: new Date(base + i * 3_600_000),
      variants: p.variants.map((variant, j) => ({
        ...variant,
        sku: `${prefix}-${String(j + 1).padStart(2, '0')}`,
      })),
    };
  });
}

export async function seedProducts() {
  await Product.deleteMany({});
  // create() rather than insertMany() so the pre('validate') hook derives
  // minPrice / maxPrice / maxDiscountPct.
  const docs = await Product.create(buildSeedProducts());
  return docs.length;
}

# MegaMart: storefront slice

One narrow path through an e-commerce site, built end to end: **listing → product detail → cart → checkout → order confirmation**, on React + Express + MongoDB. The UI follows the MegaMart Figma design.

```
client/   React 19 + Vite, React Router, TanStack Query, plain CSS
server/   Express 5, Mongoose 9, zod, JWT, Jest + supertest + mongodb-memory-server
```

## Run with Docker (everything in one command)

Requires Docker Desktop (or Docker Engine with Compose v2).

```bash
docker compose up --build        # add -d to run in the background
```

Then open **http://localhost:8080**. On first boot the API seeds 35 products into MongoDB.

| Service | What it is | Port |
|---|---|---|
| `web` | The React build served by nginx; nginx also proxies `/api` to the API | `8080` |
| `api` | Express server | `4000` |
| `mongo` | MongoDB 7. Data is kept in the `mongo-data` volume, so it survives restarts | `27017` |

Useful commands:

```bash
docker compose logs -f api                            # follow API logs
docker compose exec api node scripts/seed.js          # reset products (also empties carts)
docker compose down                                   # stop (data is kept)
docker compose down -v                                # stop and delete the database
JWT_SECRET=something-long docker compose up --build   # use your own JWT secret
```

To run only the database in Docker and the app with npm (hot reload): `docker compose up -d mongo`, then follow the quick start below with `MONGODB_URI=mongodb://localhost:27017/megamart`.

If port 8080, 4000 or 27017 is already in use, change the left side of that `ports:` entry in `docker-compose.yml` (for example `'3000:80'`).

## Quick start

Requirements: Node 20+. MongoDB is optional for a first look.

```bash
# 1. API
cd server
npm install
npm run dev            # http://localhost:4000

# 2. Web (second terminal)
cd client
npm install
npm run dev            # http://localhost:5173
```

If `MONGODB_URI` isn't set, the API starts an **in-memory MongoDB and seeds it on boot**, so the two commands above are all you need. That data resets whenever the server restarts.

To use a real database:

```bash
docker compose up -d                  # MongoDB on localhost:27017 (or use Atlas)
cp server/.env.example server/.env    # then edit as needed
cd server && npm run seed             # 35 products; also empties existing carts
npm run dev
```

On startup the server also seeds automatically if the products collection is empty.

**Tests:** `cd server && npm test`. Each test file gets its own in-memory MongoDB, so no setup is needed. The first run downloads a `mongod` binary, about 100 MB.

### Things to try by hand

- **Realme C35 → 4GB · 64GB / Glowing Black** has exactly 1 unit. Add it to the cart from two accounts (use two browsers or a private window), then check out from both.
- **Rolex Submariner** is fully out of stock. Several other products have single variants at 0 (they show as struck-through options).
- To create a stale cart: put an item in the cart in one browser, buy the remaining stock in another, then switch back. The cart refetches when the window regains focus and flags the line.

## Environment variables

**server/.env**

| Variable | Default | Notes |
|---|---|---|
| `MONGODB_URI` | *(empty)* | Empty means an in-memory DB, seeded on boot |
| `JWT_SECRET` | dev-only value | **Required** when `NODE_ENV=production`; the server refuses to start without it |
| `JWT_EXPIRES_IN` | `7d` | |
| `PORT` | `4000` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allow-list, comma-separated |

**client/.env**

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_URL` | *(empty)* | API origin for a deployed build. In dev, Vite proxies `/api` to `:4000`, so leave it empty. |

## API

Every success response is `{ data, meta? }`. Every error response is `{ error: { code, message, details? } }`, where `code` is a stable string the client switches on. All input is validated by zod schemas in one file ([server/src/validation/schemas.js](server/src/validation/schemas.js)) and applied with one middleware. Money is **integer rupees** everywhere.

| Method | Route | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/register` | – | `{ name, email, password }` → `201 { token, user }`. `409 EMAIL_TAKEN` |
| `POST` | `/api/auth/login` | – | `{ email, password }` → `{ token, user }`. `401 INVALID_CREDENTIALS` |
| `GET` | `/api/auth/me` | ✔ | The "one protected route". Cart and orders are protected too. |
| `GET` | `/api/categories` | – | Categories with product counts and best discount |
| `GET` | `/api/brands` | – | `?category=mobiles,electronics&limit=`: brands with product count, best discount and an image (feeds the home brand slider) |
| `GET` | `/api/products` | – | `?category=&brand=&minPrice=&maxPrice=&sort=&q=&page=&limit=`. `sort` ∈ `relevance, price_asc, price_desc, discount, newest`. `limit` ≤ 48. Returns `meta: { page, limit, total, totalPages }` |
| `GET` | `/api/products/:slug` | – | Full product with variants (`sku, size, color, price, mrp, stock`) |
| `GET` | `/api/cart` | ✔ | Hydrated cart: live price and stock per line, a `status` per line, and a server-computed `summary` |
| `POST` | `/api/cart/items` | ✔ | `{ productId, variantId, quantity }` merges into an existing line. `409 OUT_OF_STOCK / INSUFFICIENT_STOCK / QUANTITY_LIMIT` |
| `PATCH` | `/api/cart/items/:id` | ✔ | `{ quantity }` (1–10), checked against current stock |
| `DELETE` | `/api/cart/items/:id` | ✔ | |
| `POST` | `/api/orders` | ✔ | `{ shippingAddress, expectedTotal? }` → `201` order. `400 CART_EMPTY`, `409 CART_HAS_ISSUES / OUT_OF_STOCK / PRICE_CHANGED` (each with the fresh cart in `details.cart`) |
| `GET` | `/api/orders`, `/api/orders/:id` | ✔ | Scoped to the signed-in user, so another user's order id returns 404 |

Status codes: `400` for validation, `401` for no or expired token, `404`, `409` for a conflict with current state (stock, price, duplicate email), `500` with a generic message (details are logged, never sent).

## Data model

```
Product  { name, slug*, brand, category, description, images[],
           variants: [{ _id, sku*, size, color, colorHex, price, mrp, stock }],
           minPrice, maxPrice, maxDiscountPct }           ← derived from variants on save
Cart     { user*, items: [{ _id, product, variantId, quantity }] }
Order    { user, items: [snapshot: sku, name, image, size, color, price, mrp, quantity, lineTotal],
           subtotal, savings, shippingFee, total, shippingAddress, status }
User     { name, email*, passwordHash }
                                                           * = unique index
```

- **Variants are embedded in the product.** They are always read together, a product has only a handful of them, and the stock decrement becomes a single-document atomic update (see below). Each variant has its own SKU (globally unique index), price, MRP and stock.
- **`minPrice` is denormalised** so price filtering and sorting can use an index. In the listing, a product's price is its cheapest variant (the card shows "From ₹X"), and the price filter applies to that number.
- **Indexes:** `{category, minPrice}` for the common "category + price range/sort" query, `{brand, minPrice}` for brand pages, `{minPrice}`, `{createdAt}`, `{maxDiscountPct}` for each sort, a weighted text index on `name/brand/description` for search, and unique indexes on `slug`, `variants.sku`, `cart.user` and `user.email`.
- **The cart stores only `(product, variant, quantity)`.** Price and stock are always joined in live, so the cart can't show a stale price.
- **Orders snapshot every line,** so later price or name changes don't rewrite history.

## How overselling is prevented

The guard is in the write itself, not in a check made before it ([server/src/services/orderService.js](server/src/services/orderService.js)):

```js
Product.findOneAndUpdate(
  { _id: productId, variants: { $elemMatch: { _id: variantId, stock: { $gte: qty } } } },
  { $inc: { 'variants.$.stock': -qty } },
)
```

MongoDB matches the filter and applies the `$inc` as one atomic operation on the document. With one unit left and two checkouts at the same moment, both requests send this update, but only one can match `stock >= 1`. The second matches nothing and gets `null`, and the API returns `409 OUT_OF_STOCK`. Stock never goes below zero, because a decrement that would take it there never matches.

For a cart with several lines, lines are reserved one at a time. If line N fails, lines 1..N−1 are **put back** with a compensating `$inc`, and then the 409 is returned. A failed checkout leaves stock exactly as it was.

Why this instead of a transaction: it works on a standalone `mongod` (transactions need a replica set) and holds no locks. The trade-off is covered under "Known gaps".

**Tested** in [server/tests/orders.test.js](server/tests/orders.test.js):
- 2 buyers, 1 unit → exactly one `201`, one `409`, stock `0`, one order
- 10 buyers, 3 units → exactly three orders, stock `0`
- a multi-line order that loses the race on one line gives back the stock it had already reserved

While writing these I checked which path rejects the losers. In the 10-buyer race, most of them pass the pre-check and are stopped by the atomic update itself, so the test exercises the guard and not just the pre-check.

## How stale carts are handled

1. **The cart says so before checkout.** `GET /api/cart` hydrates every line against live stock and gives it a `status`: `ok`, `insufficient_stock` (show "Only N left", offer "Set to N"), `out_of_stock` or `unavailable` (offer Remove). The summary has `canCheckout` and an `issues` count. The cart screen shows a warning banner, highlights the lines, disables Checkout, and leaves unbuyable lines out of the total. The header cart badge turns amber.
2. **The client notices changes.** The cart query refetches on window focus and on every cart mutation. Any 409 from add/update also refreshes the product page's stock.
3. **Checkout fails cleanly if it still happens.** `POST /api/orders` re-checks the cart (`409 CART_HAS_ISSUES`), then the atomic reservation is the final word (`409 OUT_OF_STOCK`). Every 409 includes the fresh cart in `details.cart`. The client writes that straight into its cache, so the checkout page immediately shows which line broke and links back to the cart. Nothing is charged and no stock moves.
4. **Price drift:** the client sends `expectedTotal`, the total it showed. If the server's total differs, it returns `409 PRICE_CHANGED` rather than charging an amount the customer never saw.

## Frontend state

- **Server state goes in TanStack Query; there is no global client store.** The cart lives in exactly **one** cache entry, `['cart']`. Every cart mutation returns the whole recalculated cart, and that response replaces the cache entry. The header badge, cart page and checkout all read the same entry, and totals are never computed in the browser. After a refresh the cart is simply refetched from the server, so screens can't drift apart.
- **Listing filters live in the URL** (`?category=&minPrice=&sort=&q=&page=`), so refresh, back/forward and shared links all reproduce the same listing. The selected variant on the product page is also in the URL (`?sku=`).
- **Auth** is a small context. The JWT is kept in `localStorage`, and any 401 logs out and clears cached cart and order data.

Why these choices:
- **TanStack Query** because nearly all state here is server state: caching, refetch on focus and keep-previous-data while filters change are exactly what it provides.
- **JavaScript rather than TypeScript** to spend the time budget on correctness. The zod schemas give runtime type safety at the API boundary, which is where it matters most.
- **Plain CSS with tokens** because one stylesheet with Figma-derived custom properties was quicker than configuring Tailwind to match the design. The tokens are at the top of [global.css](client/src/styles/global.css).

## Design decisions (where Figma didn't say)

- **Tokens** were sampled from the Figma export: primary `#008ECC`, hero navy `#212844`, card media `#F5F5F5`, savings green `#249B3E`, 16px card radius, pill category nav, and the blue-underlined section headings. The Figma file couldn't be opened through the API (no access), so values were taken from the exported image. **The font is Mulish as an approximation**; swap the Google Fonts link if the file uses something else.
- **Product card** matches Figma: corner discount badge, price with struck MRP, divider, green "Save – ₹X". "From" appears when variants have different prices.
- **Mobile** (Figma is desktop-only):
  - The masthead wraps into logo + icons on the first row and full-width search on the second.
  - Category pills scroll horizontally.
  - Filters become a slide-over drawer with a "Show N results" button.
  - The grid has 2 columns.
  - Cart lines stack.
  - Order summaries move below the content.
  - Checked at 390px with no horizontal scroll.
- **States:**
  - Skeleton grid on first load.
  - The previous results stay visible (dimmed) while new filters load.
  - Empty listing offers "Clear filters".
  - Empty cart offers "Start shopping".
  - 404 product.
  - Network and server errors offer Retry.
  - An error boundary keeps the header and footer usable if a page crashes.
  - Inline field errors on forms; server validation errors are mapped back to the matching fields.
- **Variant picker:** size and colour are separate groups. Sold-out combinations stay clickable but are struck through, so you can still see they exist. Choosing a size that doesn't exist in the current colour switches to the closest available variant.
- **Logged-out add to cart** sends you to sign in and then back to the product.
- **Shipping:** free above ₹499, otherwise ₹40. The rule exists only on the server (`pricing.js`), so cart and order can't disagree.
- **Payment** is cash on delivery only; no gateway.
- **Home page:** the banner slider, the "Grab the best deal on Smartphones" row, the "Top Categories" circles and the "Top Electronics Brands" slider are built. "Daily Essentials" from Figma is not.
- **Sliders:** both are native scroll-snap tracks, so touch swipe and trackpads work without a library. A small hook (`useCarousel`) adds the arrows and pill dots.
  - **Banner transition:** the track slides horizontally while the incoming slide's text rises in line by line (staggered) and the product glides in from the right. The outgoing slide fades back. The active dot fills up as a countdown to the next slide. With reduced motion turned on, nothing moves: slides switch with a short crossfade and autoplay is off.
  - The banner autoplays every 5 seconds. It pauses on hover, on focus, on touch, when the tab is hidden, and for users with reduced motion. It wraps around at both ends.
  - Arrows are hidden on tablet and mobile, where you swipe.
  - The brand slider shows 3 cards on desktop, 2 on tablet and about 1.2 on mobile.
  - Each "UP to X% OFF" figure is the real best discount in that category or brand (from `/api/categories` and `/api/brands`), not the Figma placeholder 80%.
  - Brand cards show a letter mark instead of real trademark logos, and link to `/products?brand=…`.

## Known gaps / what I'd do next with another week

- **Crash safety for multi-line orders.** If the process dies between reserving line 1 and creating the order, those units stay decremented. Next step: run the reservation and order insert in a MongoDB **transaction** (replica set), or write a `pending` order first and have a sweeper release stale reservations.
- **Idempotency key on `POST /orders`,** so a double-click or a retried request can't create two orders. The button is disabled while pending, but the server should enforce it too.
- **Guest cart** in local storage, merged into the server cart on login. Right now you have to sign in before adding.
- **Search:** `$text` matches whole words with stemming, so a prefix like "gal" doesn't find "Galaxy". Atlas Search or an n-gram index would fix that.
- **Variant images:** images belong to the product, not the variant, so picking "Glowing Black" still shows the green photo.
- **Frontend tests** (React Testing Library for the cart page states) and a Playwright smoke test in CI. I drove the full flow in headless Chrome by hand while building, but it isn't committed as a test.
- **Auth hardening:** httpOnly refresh-token cookie instead of `localStorage`, rate limiting on login, and password reset.
- **Ops:** an order list page, admin stock editing, structured logging, and a deploy (Render for the API plus Atlas, Vercel for the client).
- Images come from the public dummyjson CDN. In production they'd be our own assets behind a CDN with responsive sizes.

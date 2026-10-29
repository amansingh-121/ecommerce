# Aureva Commerce

Aureva is a full-stack, luxury-inspired e-commerce storefront with a React 19 + Vite frontend and an Express API. It includes a complete shopping experience: catalog browsing and filtering, product detail pages, a persistent cart, coupon validation, checkout, order tracking, returns, reviews, and an admin dashboard.

## Highlights

- **Storefront** — 27 products across Electronics, Fashion, Home, Beauty, and Sports with search, category/subcategory filters, brand multi-select, price bands, ratings, discount filters, sorting, and paginated results.
- **Local imagery** — all 35 product, category, hero, and avatar images are bundled under `public/images/` for instant, reliable rendering with no remote image dependency.
- **Home experience** — curated hero, five collection tiles, new arrivals, best sellers, featured customer reviews, copyable live coupon codes, and newsletter signup.
- **Cart & checkout** — guest-friendly cart with size/color variants, quantity controls, saved-address selection, coupon codes, GST (18%), and free standard shipping above ₹2,999.
- **Orders** — order confirmation, live dispatch timeline, status filters, downloadable GST invoices, cancellation, and return requests.
- **Accounts** — an overview dashboard with order stats, profile editing, saved addresses with defaults, a persistent wishlist with recommendations, and order history.
- **Product discovery** — recently viewed products, quick view, wishlist actions, review summaries, and the Style Concierge.
- **Admin suite** — revenue/order analytics, product management, inventory updates, category CRUD, review moderation, coupon create/edit/delete, and customer lifetime-value/activation controls.
- **Style concierge** — an on-server recommendation engine that suggests products based on budget, category, and style preferences. No third-party services are required.
- **Review synthesis** — a local consensus summary generated from actual customer reviews on the product page.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4, Lucide icons, Motion |
| Backend | Express 4, TypeScript (tsx) |
| Data | In-memory seeded data store (`server/db.ts`) |
| Tests | Node test runner via `tsx` |

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:3000`. Vite serves the app and mounts the Express API under `/api` through middleware, so no separate backend process is needed during development.

### Production build

```bash
npm run build
npm start
```

`npm run build` emits the frontend to `dist/`. `npm start` runs the Express server, which serves `dist/` and the `/api` routes on `PORT` (default `3000`).

### Environment

Copy `.env.example` to `.env` only if you need to override defaults:

```env
PORT=3000
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server with the API middleware |
| `npm run build` | Production build into `dist/` |
| `npm start` | Serve the built app and API with Express |
| `npm run lint` | TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Run cart and order engine unit tests |
| `npm run clean` | Remove `dist/` and generated server output |

## Demo Accounts

- **Customer:** `alex@aureva.com`
- **Admin:** `admin@aureva.com`

The login endpoint accepts any email and creates a customer account on the fly; emails containing `admin` receive the admin role.

## Coupons

| Code | Benefit |
| --- | --- |
| `AUREVA10` | 10% off |
| `AUREVA15` | 15% off |
| `WELCOME10` | 10% off first order |
| `SAVE500` | ₹500 off |
| `FREESHIP` | Free shipping |

## Project Layout

```text
public/
  images/         Local product, category, hero, and avatar imagery
server/
  api.ts          Express routes (auth, catalog, coupons, orders, reviews, admin)
  db.ts           In-memory data store, seeds, pricing and shipping rules
src/
  components/     Header, footer, cart drawer, modals, product cards
  context/        Store context (cart, user, wishlist, navigation)
  data/           Initial catalog seed
  pages/          Home, catalog, product detail, checkout, orders, account, admin
  hooks/          Shared overlay behavior (Escape-to-close and scroll lock)
  utils/          Currency, cart calculator, order engine, style helpers
  types/          Shared TypeScript interfaces
```

## API Overview

| Area | Endpoints |
| --- | --- |
| Catalog | `GET /api/products`, `GET /api/products/:id`, `GET /api/categories` |
| Accounts | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Commerce | `GET /api/coupons/active`, `POST /api/coupons/validate`, `POST /api/orders`, `GET /api/orders` |
| Orders | `GET /api/orders/:id`, `GET /api/orders/:id/invoice`, `PATCH /api/orders/:id/status`, cancel/return actions |
| Reviews | `GET/POST /api/products/:id/reviews`, `GET /api/reviews/featured`, `POST /api/reviews/summary` |
| Discovery | `POST /api/concierge` |
| Newsletter | `POST /api/newsletter/subscribe` |
| Admin | Admin stats, products, categories, coupons, customers, reviews, and moderation under `/api/admin/*` |

## Notes

Data is held in memory and resets when the server restarts. The project is intended as a self-contained demo and can be extended with a persistent database by replacing the store in `server/db.ts`.

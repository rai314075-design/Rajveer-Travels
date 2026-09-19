# Rajveer Travels — Bus Booking Platform

Next.js 14 (App Router) + TypeScript. Dual database, Auth0 login, Razorpay payments, admin dashboard.

## Why two databases

- **PostgreSQL (via Prisma)** — the transactional core: `User`, `Bus`, `Route`, `Trip`, `Seat`,
  `Booking`, `Payment`. Relational + ACID transactions matter here so two people can't book the
  same seat, and so a booking/payment/seat-status update commits atomically.
- **MongoDB (via Mongoose)** — supplementary, high-write, schema-flexible data: `Review` and
  `Notification`. These don't need joins against the booking tables and benefit from a looser shape.

If you'd rather run on just one database, the Postgres side is fully self-sufficient — Mongo can be
dropped by removing `src/lib/mongodb.ts`, `src/models/*`, and the `Notification.create(...)` call in
the payment verify route.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your Postgres connection string
   - `MONGODB_URI` — your MongoDB Atlas (or local) connection string
   - `AUTH0_*` — from your Auth0 application dashboard (Regular Web App)
   - `RAZORPAY_*` — from your Razorpay dashboard (test mode keys to start)
   - `JWT_SECRET`, `ADMIN_EMAIL` — `ADMIN_EMAIL` is auto-promoted to role `ADMIN` on first login
3. `npx prisma migrate dev --name init` — creates all Postgres tables
4. `npm run dev` — runs at http://localhost:3000

## Auth0 setup notes

In your Auth0 app settings, set:
- Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
- Allowed Logout URLs: `http://localhost:3000`
- Allowed Web Origins: `http://localhost:3000`

The first user to log in with the email matching `ADMIN_EMAIL` is automatically given the `ADMIN`
role in Postgres and can access `/admin`.

## Razorpay flow

1. Frontend creates a booking (PENDING) → calls `POST /api/payment/create-order`
2. Razorpay Checkout opens client-side with the returned `orderId`
3. On success, frontend calls `POST /api/payment/verify` with the signature
4. Server verifies the HMAC signature, marks payment `PAID`, booking `CONFIRMED`, seats `BOOKED`,
   and writes a confirmation `Notification` to MongoDB

## What's scaffolded vs. left for you

Scaffolded: schema, auth, payment API routes, admin CRUD for buses/routes/trips (with auto seat
generation), search page, home page.

Left as next steps: the seat-map selection UI + checkout page (`/trip/[id]`), seat-locking logic
(recommend a `lockedUntil` timestamp + a cron/cleanup job, or Redis if you want it stronger),
booking history page, PDF ticket generation, and the Razorpay Checkout `<script>` embed on the
frontend (needs `NEXT_PUBLIC_RAZORPAY_KEY_ID`).

## Folder structure

```
src/
  app/
    admin/           admin dashboard (buses, routes, trips)
    api/
      admin/         admin CRUD endpoints
      auth/[auth0]/  Auth0 login/callback handler
      payment/       Razorpay order + verify
    search/          search results page
    page.tsx         home/search form
  lib/               prisma client, mongodb connection, admin guard
  models/            Mongoose models (Review, Notification)
prisma/schema.prisma  Postgres schema
```

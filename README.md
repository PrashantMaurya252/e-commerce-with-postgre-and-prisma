# E‑Commerce Platform (Next.js, Node.js, PostgreSQL, Prisma)

Full‑stack e‑commerce application with a modern Next.js frontend and a scalable Node.js/Express backend, powered by PostgreSQL + Prisma, Redis, Stripe payments, Cloudinary media storage, and background job processing via BullMQ.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Install Dependencies](#install-dependencies)
  - [Database Setup](#database-setup)
  - [Run in Development](#run-in-development)
  - [Build & Run in Production](#build--run-in-production)
- [API Overview](#api-overview)
- [Background Jobs & Queues](#background-jobs--queues)
- [Metrics & Monitoring](#metrics--monitoring)
- [Testing](#testing)
- [Deployment Notes](#deployment-notes)
- [License](#license)

---

## Features

### User Features

- Email/password authentication with JWT access & refresh tokens
- Google OAuth login (`@react-oauth/google`)
- Email OTP flows for:
  - Email verification
  - Forgot password / reset password
- Product catalogue:
  - Categories (Electronics, Clothes, Daily Usage, etc.)
  - Product images and galleries (Cloudinary integration)
  - Ratings and reviews with average rating and review count
- Shopping cart:
  - Persistent cart per user (PostgreSQL + Prisma models `Cart` & `CartItem`)
  - Increment/decrement/delete items from cart
- Coupon system:
  - Percentage/flat discounts
  - Min cart values, usage limits, expiration dates
- Checkout and orders:
  - Order creation and order items
  - Address management
  - Order statuses (Pending, Paid, Shipped, Delivered, Cancelled, etc.)
- Stripe payments:
  - Payment Intents in INR
  - Secure card payments with `@stripe/react-stripe-js`
  - Payment model with status tracking (Pending, Succeeded, Failed, Refunded)

### Admin Features

- Admin area (under `frontend/app/admin/...`)
- Manage products (list, create, update, disable)
- View and manage orders
- Access control via role-based guards (`RoleGuard`, `isAdmin` flag on `User`)

### System / Platform Features

- PostgreSQL + Prisma schema containing:
  - `User`, `Product`, `Order`, `OrderItem`, `Cart`, `CartItem`
  - `Coupon`, `CouponUsage`, `Review`, `Payment`, `File`, `RefreshToken`, `Otp`
- Cloudinary integration for product and user media files
- Redis integration for:
  - BullMQ job queues (email sending)
  - Caching / background processing support
- Nodemailer email integration (OTP and notification emails)
- Background jobs:
  - OTP cleanup
  - Refresh token cleanup
  - Coupon housekeeping
- Centralized logging using Winston + daily rotate file
- HTTP request metrics with Prometheus via `prom-client`
- Stripe webhook handling for payment events

---

## Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript, React 19
- **State Management**: Redux Toolkit, React Redux
- **UI & Styling**:
  - Tailwind CSS v4
  - Radix UI primitives
  - Custom UI components (buttons, inputs, cards, sheets, skeletons, carousels)
  - `lucide-react` icons
- **APIs & Auth**:
  - Axios with interceptors for automatic access token refresh
  - JWT stored/managed in Redux, refresh via `/auth/refresh-token`
  - Google OAuth client
- **Payments**:
  - `@stripe/stripe-js` + `@stripe/react-stripe-js` for Stripe Elements

### Backend

- **Runtime**: Node.js (TypeScript, ES modules)
- **Framework**: Express 5
- **Database**: PostgreSQL
- **ORM**: Prisma (`@prisma/client`, `@prisma/adapter-pg`)
- **Auth & Security**:
  - `jsonwebtoken` for JWT access and refresh tokens
  - `bcryptjs` for password hashing
  - `helmet`, `hpp`, `cors`, and Express rate limiting
  - Cookie-based refresh token flows (`withCredentials` from frontend)
- **Payments**: Stripe SDK for Payment Intents
- **Queues & Background Jobs**:
  - Redis (`ioredis`)
  - BullMQ queues and workers
  - Node cron-style jobs
- **Media**: Cloudinary SDK for file storage (`File` model with `FileType` & `FilePurpose`)
- **Email**:
  - Nodemailer with SMTP (Gmail)
  - OTP email templating
- **Observability**:
  - Morgan + Winston logging
  - Prometheus metrics via `prom-client`

---

## Architecture

This repo is a simple multi-package setup:

- `backend/` – REST API, authentication, database, background jobs, Stripe, and metrics.
- `frontend/` – Next.js UI consuming the backend API.

**Backend API base path** (in development):

- `http://localhost:PORT/api/v1` (configure `PORT` and `NEXT_PUBLIC_BACKEND_API_URL` accordingly)

**Frontend** consumes the backend via:

- `NEXT_PUBLIC_BACKEND_API_URL` (e.g. `http://localhost:5000/api/v1`)

---

## Project Structure

High-level layout:

```text
.
├── backend
│   ├── package.json
│   ├── prisma
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src
│       ├── server.ts
│       ├── app.ts
│       ├── config
│       │   ├── prisma.ts
│       │   ├── redis.ts
│       │   └── cloudinary.ts
│       ├── controllers
│       │   ├── auth.controller.ts
│       │   ├── product.controller.ts
│       │   ├── cart.controller.ts
│       │   ├── order.controller.ts
│       │   ├── user.controller.ts
│       │   ├── admin.controller.ts
│       │   └── file.controller.ts
│       ├── routes
│       │   ├── auth.routes.ts
│       │   ├── product.routes.ts
│       │   ├── cart.routes.ts
│       │   ├── order.routes.ts
│       │   ├── user.routes.ts
│       │   ├── admin.routes.ts
│       │   ├── file.routes.ts
│       │   ├── payment.routes.ts
│       │   └── webhook.routes.ts
│       ├── middlewares
│       │   ├── auth.ts
│       │   ├── authorize.ts
│       │   ├── rateLimiter.ts
│       │   └── errorHandler.ts
│       ├── jobs
│       │   ├── otpCleanup.ts
│       │   ├── deleteExpiredRefreshToken.ts
│       │   └── coupon.ts
│       ├── queues
│       │   └── email.queues.ts
│       ├── workers
│       │   └── email.worker.ts
│       └── utils
│           ├── jwt.ts
│           ├── mailer.ts
│           ├── email.service.ts
│           ├── metrics.ts
│           ├── logger.ts
│           ├── multer.ts
│           ├── helper.ts
│           └── connectToDB.ts
└── frontend
    ├── package.json
    ├── app
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx
    │   ├── auth/...
    │   ├── user/...
    │   └── admin/...
    ├── components
    │   ├── Navbar.tsx
    │   ├── MobileNavbar.tsx
    │   ├── home/...
    │   ├── products/...
    │   ├── guards/AuthGuard.tsx
    │   ├── guards/RoleGuard.tsx
    │   └── ui/...
    ├── redux
    └── utils
        ├── api.ts
        └── interceptor.ts
```

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm, pnpm, or yarn
- PostgreSQL database
- Redis instance
- Stripe account + API keys
- Cloudinary account
- Gmail account (or any SMTP credentials) for emails

### Environment Variables

#### Backend (`backend/.env`)

Create a `.env` file in `backend/` with:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/ecommerce_db?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_TOKEN_SECRET=your_access_token_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
MAIL_USER=your_gmail_address@gmail.com
MAIL_PASS=your_gmail_app_password

# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key
```

#### Frontend (`frontend/.env.local`)

Create `.env.local` in `frontend/`:

```env
# Backend API base URL (note: backend mounts API at /api/v1)
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api/v1

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Install Dependencies

From the repository root:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Database Setup

From `backend/`:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates schema & tables)
npm run prisma:migrate
```

Ensure your `DATABASE_URL` is configured correctly before running migrations.

### Run in Development

In **two terminals**:

```bash
# 1. Backend (from backend/)
cd backend
npm run dev

# Backend will listen on PORT (e.g. http://localhost:5000)

# 2. Frontend (from frontend/)
cd frontend
npm run dev

# Frontend will run on http://localhost:3000
```

Make sure CORS settings in `backend/src/app.ts` match your frontend origin (by default `http://localhost:3000`).

### Build & Run in Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

In production, point your env URLs (`NEXT_PUBLIC_BACKEND_API_URL`, `REDIS_URL`, `DATABASE_URL`, etc.) to production services.

---

## API Overview

Base path (development):

```text
http://localhost:5000/api/v1
```

Main route groups (see `backend/src/app.ts`):

- `POST /api/v1/auth/...` – sign up, login, logout, OTP flows, Google login, me, refresh-token
- `GET /api/v1/product/...` – product listing, filtering, details
- `GET/POST /api/v1/cart/...` – cart operations, coupons, checkout
- `GET /api/v1/orders/...` – order listing and details
- `GET /api/v1/user/...` – user profile, addresses, etc.
- `GET/POST /api/v1/admin/...` – admin-only product & order management
- `POST /api/v1/file/...` – file upload and management
- `POST /api/v1/payment/create-payment-intent` – create Stripe PaymentIntent
- `POST /api/stripe/...` – Stripe webhook endpoints

Authentication:

- Access tokens (JWT) are issued on login and used via `Authorization: Bearer <token>`.
- The frontend Axios interceptor automatically:
  - Detects `401` responses
  - Calls `/auth/refresh-token` with `withCredentials: true`
  - Updates the access token in Redux and retried the original request.

---

## Background Jobs & Queues

The backend uses Redis + BullMQ for background work:

- Queue: `email.queues.ts`
- Worker: `email.worker.ts` (sends OTP and email notifications using Nodemailer)
- Scheduled jobs (`jobs/`):
  - `otpCleanup.ts` – removes expired OTP records
  - `deleteExpiredRefreshToken.ts` – cleans up expired refresh tokens
  - `coupon.ts` – manages coupon state/expiration

To run workers, you can add a separate process:

```bash
cd backend
npm run worker
```

---

## Metrics & Monitoring

The backend exposes Prometheus metrics:

- `GET /metrics` – returns metrics collected by `prom-client`

Metrics include:

- HTTP request counters
- Request durations
- Basic performance data (integrated with Morgan and custom logger)

You can scrape this endpoint from Prometheus and visualize in Grafana or another monitoring tool.

---

## Testing

- There is currently no fully configured automated test suite in the dependencies.
- You can introduce Jest, Vitest, or another framework for:
  - Unit tests (services, controllers, utils)
  - Integration tests (routes, database, payment flows)

Recommended starting point:

- Add test runner configuration in `backend/` and `frontend/`.
- Introduce CI to run tests on each commit/pull request.

---

## Deployment Notes

- **Frontend**:
  - Can be deployed to platforms like Vercel (Next.js native support).
  - Ensure `NEXT_PUBLIC_*` env variables are set in the deployment environment.
- **Backend**:
  - Deploy to any Node.js host (Render, Railway, AWS, etc.).
  - Configure:
    - `DATABASE_URL` pointing to managed PostgreSQL
    - `REDIS_URL` pointing to managed Redis
    - `STRIPE_SECRET_KEY`, Cloudinary, and email SMTP credentials
  - Update CORS configuration in `app.ts` to the production frontend domain.

Ensure HTTPS is enforced in production and secure cookies are configured for auth.

---

## License

Add your preferred license here (e.g. MIT, Apache 2.0). If unsure, MIT is a popular default for open-source projects.


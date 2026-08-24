# ServicePlus

A full-stack home services booking platform built with React, TanStack Start, NestJS, PostgreSQL, and Redis.

## Architecture

```
serviceplus/
├── frontend/          # React + TanStack Start (SSR)
├── backend/           # NestJS REST API
├── prisma/            # Database schema
└── README.md
```

- **Database**: Neon (serverless PostgreSQL)
- **Cache/Queue**: Redis Cloud (30MB free tier — reserved for future use: rate limiting, caching, BullMQ)

## Tech Stack

### Frontend
- React 19 + TypeScript
- TanStack Start (SSR)
- TanStack Router + TanStack Query
- Vite 7
- Tailwind CSS v4 + shadcn/ui
- React Hook Form + Zod
- Recharts, Sonner

### Backend
- NestJS 10 + TypeScript
- Prisma ORM (Neon PostgreSQL)
- Redis Cloud (ioredis + BullMQ — ready for use)
- JWT Authentication (stateless, no server-side sessions)
- Socket.IO (WebSockets)

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### 1. Setup Backend

```bash
cd backend
cp .env.example .env    # Fill in Neon + Redis Cloud credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Backend runs on http://localhost:3001

### 2. Setup Frontend

```bash
cd frontend
cp .env.example .env    # Set VITE_API_BASE_URL=http://localhost:3001/api
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
API_PREFIX=api
FRONTEND_URL=http://localhost:3000

# PostgreSQL (Neon)
DATABASE_URL=postgresql://user:password@your-neon-host/neondb?sslmode=require

# Redis (Redis Cloud) — optional, reserved for caching/rate-limiting
REDIS_URL=redis://default:password@your-redis-host:port

# JWT
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OTP (mock for development)
OTP_PROVIDER=mock

# Payments (mock for development)
PAYMENT_PROVIDER=mock

# Storage (local for development)
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./storage

# Google Maps
GOOGLE_MAPS_API_KEY=
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GOOGLE_MAPS_BROWSER_KEY=
```

## Development Commands

### Backend
```bash
npm run start:dev          # Start in development mode
npm run build              # Build for production
npm run start:prod         # Start in production mode
npx prisma migrate dev     # Run migrations
npx prisma studio          # Open Prisma Studio
npx prisma generate        # Generate Prisma Client
```

### Frontend
```bash
npm run dev                # Start dev server
npm run build              # Build for production
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript check
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Services
- `GET /api/services/home-catalog` - Home page catalog
- `GET /api/services/:slug` - Service details
- `GET /api/services/category/:slug` - Category with services
- `GET /api/services/search?q=` - Search services

### Bookings
- `POST /api/booking/quote` - Get price quote
- `POST /api/booking/availability` - Check available slots
- `POST /api/booking` - Create booking
- `GET /api/booking/my-bookings` - User's bookings
- `POST /api/booking/:id/cancel` - Cancel booking

### Admin
- `GET /api/admin/overview` - Dashboard overview
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/customers` - All customers
- `GET /api/admin/services` - All services
- And more...

## Project Structure

### Frontend
```
frontend/src/
├── frontend/
│   ├── components/     # React components
│   │   ├── admin/      # Admin panel components
│   │   ├── layout/     # Navbar, Footer
│   │   └── ui/         # shadcn/ui components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities, API client, auth
├── routes/             # TanStack Router file-based routes
├── router.tsx          # Router configuration
├── server.ts           # Server entry point
├── start.ts            # TanStack Start config
└── styles.css          # Tailwind CSS + design system
```

### Backend
```
backend/src/
├── auth/               # Authentication module
├── services/           # Services catalog module
├── booking/            # Booking management module
├── admin/              # Admin operations module
├── availability/       # Scheduling module
├── pricing/            # Pricing calculation module
├── geo/                # Geolocation module
├── media/              # File upload module
├── common/             # Shared providers (OTP, Payment, Storage)
├── prisma/             # Prisma service
└── main.ts             # NestJS bootstrap
```

## License

Private - All rights reserved.

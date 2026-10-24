# BAO BAO — Smart Community Transportation Platform (Talibon, Bohol)

> Inclusive Community Transportation Platform connecting passengers with traditional Tricycles, Bao Bao (e-tricycles), and local vehicles across three unified channels: **App**, **SMS**, and **Terminal Dispatcher**.

## Table of Contents

1. [Architecture & Monorepo Structure](#1-architecture--monorepo-structure)
2. [How to Run](#2-how-to-run)
3. [The Three Driver Channels & Tracking Honesty Rule](#3-the-three-driver-channels--tracking-honesty-rule)
4. [Ride State Machine](#4-ride-state-machine)

---

## 1. Architecture & Monorepo Structure

```
.
├── apps/
│   ├── api/                     # NestJS Backend API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # PostgreSQL MVP Tables (ERD)
│   │   │   └── seed.ts         # Seed data (Zones, Terminals, 3 Channels Drivers)
│   │   ├── src/
│   │   │   ├── common/         # Guards (JWT + Profiles DB Role), Filters, Decorators
│   │   │   ├── modules/
│   │   │   │   ├── admin/      # Admin dashboard & fleet approval
│   │   │   │   ├── auth/       # Supabase auth synchronization
│   │   │   │   ├── channels/   # Channel adapters (App, SMS, Dispatcher)
│   │   │   │   ├── dispatch/   # Dispatch engine, candidate ranking & row locking
│   │   │   │   ├── dispatcher/ # Terminal dispatcher console & queue
│   │   │   │   ├── drivers/    # Driver registration, status & location
│   │   │   │   ├── location/   # PostGIS nearby search & freshness downgrade
│   │   │   │   ├── rides/      # Pure RideStateMachine & CRUD
│   │   │   │   ├── sms/        # Pure SmsCommandParser & webhook handler
│   │   │   │   ├── users/      # Profile management
│   │   │   │   └── zones/      # Coverage zones & terminals
│   │   │   ├── app.module.ts
│   │   │   └── swagger.setup.ts # OpenAPI Swagger documentation
│   │   └── test/               # E2E dispatch & concurrency test
│   └── web/                    # React 18 + Vite + Tailwind + Leaflet
│       └── src/
│           ├── components/     # TrackingBadge, StatusPill, MapView, AppShell
│           ├── pages/          # Passenger, Driver, Dispatcher, Admin interfaces
│           └── lib/            # Typed API client, Auth store, i18n (en, ceb)
├── packages/
│   └── shared/                 # Enums, Transition Table, DTOs, Zod schemas
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql       # PostGIS extensions, geography columns, GiST & partial unique indexes
│       └── 0002_rls.sql        # Row Level Security policies
├── scripts/
│   └── test-runner.ts          # Universal unit & E2E test runner
└── server.ts                   # Full-Stack entry point (Express + NestJS + Vite middleware)
```

---

## 2. How to Run

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Supabase project)
- Environment variables configured

### Installation
```bash
pnpm install
# or
npm install
```

### Environment Configuration
Copy environment files:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Database Migrations & Seed (Supabase)
Apply SQL migrations directly in Supabase or using local PostgreSQL:
```bash
# Apply SQL migrations:
psql $DATABASE_URL -f supabase/migrations/0001_init.sql
psql $DATABASE_URL -f supabase/migrations/0002_rls.sql

# Run seed script:
npm run seed
```

### Running the Development Server
Starts the full-stack server (NestJS API mounted on Express + Vite frontend middleware) on port 3000:
```bash
npm run dev
```

- **Web Application:** `http://localhost:3000/`
- **Swagger API Documentation:** `http://localhost:3000/api/docs`
- **Health Check Endpoint:** `http://localhost:3000/health`
- **API Base URL:** `http://localhost:3000/api/v1`

### Running the Test Suite
Executes the pure `RideStateMachine` tests, `SmsCommandParser` tests, `calculateLocationFreshness` downgrade tests, and the E2E ride dispatch & acceptance concurrency test:

```bash
npm test
```

### Build for Production
```bash
npm run build
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm test` - Run test suite (unit + E2E)
- `npm run preview` - Preview production build
- `npm run clean` - Clean build artifacts
- `npm run lint` - Run TypeScript type checking

---

## 4. The Three Driver Channels & Tracking Honesty Rule

| Channel | Description | Offer Delivery | Acceptance Mechanism | Tracking Source | UI Badge |
|---|---|---|---|---|---|
| **APP** | Smartphone drivers | Realtime push & in-app modal | `POST /driver/offers/:id/accept` | Live GPS ping (&lt; 2 min) | 🟢 LIVE GPS |
| **SMS** | Basic phone drivers | Outbound SMS via gateway | Inbound reply `1` or `1 184` | Last SMS `AT <zone>` | 🟡 LAST REPORTED |
| **DISPATCHER** | Stationed terminal drivers | Terminal console | Dispatcher assigns on driver behalf | Terminal queue check-in | ⚪ TERMINAL QUEUE |

**Honesty Rule:** Non-live locations are never labeled as live. `LIVE_APP` location pings older than 2 minutes are automatically downgraded to `LAST_REPORTED`. Locations older than 30 minutes are excluded from active passenger map queries.

---

## 5. Ride State Machine

Transitions enforced in `RideStateMachine` (`apps/api/src/modules/rides/ride-state-machine.ts`):
```
REQUESTED ──> DISPATCHING ──> OFFERED ──> ACCEPTED ──> DRIVER_EN_ROUTE ──> ARRIVED ──> IN_PROGRESS ──> COMPLETED
    │             │              │             │              │
    └─────────────┴──────────────┴─────────────┴──────────────┴──> CANCELLED (Passenger/Admin)
    │             │
    └─────────────┴──> EXPIRED (System TTL)
    │
DISPATCHING ──> NO_DRIVER_FOUND ──> REQUESTED (Passenger Retry)
```
Any invalid transition triggers HTTP 409 `RIDE_INVALID_TRANSITION`.
Passenger active ride concurrency is enforced at the database level (`uq_one_active_ride_per_passenger`).
Offer acceptance is protected with row-locking concurrency control (`OFFER_ALREADY_TAKEN`).
Driver phone numbers are strictly redacted from passenger-facing responses.

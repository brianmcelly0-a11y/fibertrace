# FiberTrace - Fiber Technician Management Application

## Overview

FiberTrace is a comprehensive cross-platform application designed for fiber optic technicians to manage jobs, track inventory, monitor equipment, and visualize fiber routes. Built with a modern tech stack, it provides both offline-first capabilities and real-time data synchronization for field technicians.

**Multi-Platform Architecture:**
- **Web App**: React + Express (original version - `/client` and `/server`)
- **Mobile App**: React Native + Expo (new iOS/Android version - `/mobile`)

The application features a dark-themed UI with neon-blue accents, creating a technical aesthetic suitable for infrastructure management. It supports role-based access (Technician, Team Leader, Manager) and provides essential tools for day-to-day fiber optic installation and maintenance work.

## Project Structure

```
.
├── client/              # Web app (React + Vite)
├── server/              # Backend API (Express + Node.js)
├── shared/              # Shared types and schemas
├── mobile/              # Mobile app (React Native + Expo)
│   ├── src/
│   │   ├── screens/     # Map, Jobs screens
│   │   ├── lib/         # API client, utilities
│   │   ├── theme/       # Colors and styling
│   │   └── App.tsx      # Main app
│   └── package.json
└── server/              # Shared backend for web & mobile
```

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Implementation - Web & Mobile Parity with Operational Enhancements (November 25, 2025)

### Web App Enhanced with Mobile Parity ✅

**WEB ENHANCEMENTS ADDED:**
- Job Operational Manager - Auto-calculations for cable, time, power impact
- JobFormDialog - Advanced job creation with route preview
- JobDetailsDialog - Full job management with inline editing
- Enhanced Jobs page - Tap-to-view details with modal
- Enhanced Map page - Multi-node selection with route distance

**New Web Components:**
- `client/src/lib/jobOperationalManager.ts` - Calculation engine
- `client/src/components/JobFormDialog.tsx` - Job creation dialog
- `client/src/components/JobDetailsDialog.tsx` - Job details management

**Features:**
- ✅ Multi-node route creation
- ✅ Auto-calculated cable & time estimates
- ✅ Job lifecycle management (Pending → In Progress → Completed)
- ✅ Inline note editing
- ✅ Power impact analysis
- ✅ Same dark theme as mobile
- ✅ Identical backend integration

---

## Recent Implementation - Mobile App with Operational Enhancements (November 25, 2025)

### React Native Mobile App with Job Fine-Tuning ✅

**NEW `/mobile` directory with React Native + Expo:**
- **Interactive Map** - All fiber node types (OLT, Splitter, FAT, ATB, Closure) with multi-select
- **Job Management** - Create, edit, and track jobs with full lifecycle
- **Node-Based Planning** - Select multiple nodes for route planning
- **GPS Tracking** - Real-time route recording with auto-calculations
- **Route Optimization** - Auto-estimate cable needs and completion time
- **Job Details Screen** - Full job info, status updates, notes editing
- **Dark Theme** - Neon-blue accents matching web design
- **Backend Sync** - Same Express API as web app

**Mobile App Structure:**
```
mobile/
├── src/
│   ├── screens/         # Map, Jobs, JobDetails, JobForm
│   ├── lib/
│   │   ├── api.ts       # Backend client with job CRUD
│   │   ├── jobManager.ts # Job optimization logic
│   │   └── utils.ts     # GPS & calculations
│   ├── theme/           # Dark theme colors
│   └── App.tsx          # Tab navigation
├── app.json             # Expo config
├── package.json         # Dependencies
├── OPERATIONAL_ENHANCEMENTS.md  # Feature guide
└── README.md            # Full docs
```

**Operational Enhancements:**
- ✅ Multi-node route creation from map
- ✅ Automatic cable & time estimation
- ✅ GPS path tracking with distance calculation
- ✅ Job creation form with route preview
- ✅ Full job details view with edit capability
- ✅ Status management (Pending → In Progress → Completed)
- ✅ Fiber route persistence to backend
- ✅ Power impact analysis based on node count

**Quick Start:**
```bash
cd mobile
npm install --legacy-peer-deps
npm start                # Dev server
npm run ios              # iOS simulator
npm run android          # Android emulator
```

**Documentation:**
- `mobile/MOBILE_SETUP.md` - Setup & installation guide
- `mobile/OPERATIONAL_ENHANCEMENTS.md` - Feature guide with examples
- `mobile/README.md` - Full technical documentation

## Recent Implementation - Phase 3 Complete

### Phase 3 Features (Completed November 25, 2025)

**Job Creation & Route Management**
- Public job creation API endpoints (no auth required)
- Create jobs directly from selected nodes and GPS routes
- Job list modal showing all created jobs
- Phase 3 utilities for job management: `client/src/lib/jobUtils.ts`
- Job status tracking (Pending, In Progress, Completed)
- Distance calculations for job routes
- API endpoints for public job/route access:
  - `POST /api/jobs` - Create jobs without authentication
  - `GET /api/jobs` - List all jobs publicly accessible
  - `GET /api/fiber-routes` - Fetch all fiber routes
  - `POST /api/fiber-routes` - Save route as fiber route

**Fiber Route Integration**
- Save GPS paths and routes to job records
- Calculate route distances and cable requirements
- Link multiple nodes to single job
- Fiber routes persist across sessions

**UI Components Added**
- Job creation dialog (triggered by route selection)
- Job list management modal
- Job cards with status badges
- Integration with existing node selection/GPS tracking

## Recent Implementation - Phase 2 Complete

### Phase 2 Features (Completed November 25, 2025)

**Search & Filter Functionality**
- Real-time search across node names, types, locations, and notes
- Filter by node type (OLT, Splitter, FAT, ATB, Closure)
- Filter by power level (High ≥0dB, Medium -10 to 0dB, Low <-10dB)
- Live result count display

**Bulk Operations**
- Multi-select nodes with checkboxes
- Export selected nodes to JSON or CSV formats
- Import nodes from JSON/CSV files
- Bulk delete capability (API endpoint ready)

**Data Export/Import Utilities** (`client/src/lib/dataUtils.ts`)
- `exportToJSON()` - Export nodes with timestamps
- `exportToCSV()` - CSV with full node details
- `importFromJSON()` - Parse and validate JSON imports
- `importFromCSV()` - Handle quoted CSV values
- `filterNodesBySearch()` - Multi-criteria filtering
- `getNodeTypes()` - Dynamic type extraction

**Power Analysis Dashboard**
- Average power calculation across all nodes
- Min/max power range display
- Power distribution histogram (High/Medium/Low/Critical counts)
- Critical node identification (lowest 5 power levels)
- Color-coded power level indicators (green/yellow/orange/red)

**Power Analysis Utilities** (`client/src/lib/powerAnalysis.ts`)
- `calculatePowerMetrics()` - Individual node power status
- `analyzePowerDistribution()` - Fleet-wide power analysis
- `getPowerStatus()` - Color and status mapping
- `calculatePowerLoss()` - Distance-based loss estimation (~0.2dB/km)

**Route Optimization Tools** (`client/src/lib/routeOptimization.ts`)
- `calculateDistance()` - Haversine formula for GPS coordinates
- `findNearestNeighborRoute()` - Greedy optimization algorithm
- `findOptimalRoute()` - Point-to-point routing with intermediates
- `findCriticalPath()` - Identify nodes needing attention
- `getRouteStats()` - Calculate segments, distance, power loss, ETA

**Mobile Responsive Design**
- Sidebar: Full width on mobile (1/3 height), 320px on desktop
- Map: 2/3 height on mobile when sidebar open, full screen when closed
- Flexible Tailwind grid layouts (1-4 column responsive grids)
- Touch-friendly controls and proper font sizing
- Collapse/expand transitions with duration-300

**UI Components Added**
- Search input with live filtering
- Type/Power level select filters
- Checkbox-based node selection list
- Export buttons (JSON/CSV)
- Import file input with drag-drop ready
- Power analysis display with critical nodes
- Route optimization tips panel

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server, providing fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query (React Query)** for server state management, caching, and data synchronization

**UI Component System**
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS v4** for utility-first styling with custom theme configuration
- **CSS Variables** for dynamic theming (dark mode with neon-blue/purple accents)
- Custom fonts: Rajdhani for headers, Inter for body text
- Lucide icons for consistent iconography

**Form & Data Validation**
- **React Hook Form** for performant form state management
- **Zod** for runtime schema validation
- **@hookform/resolvers** to integrate Zod with React Hook Form

**Mapping & Visualization**
- **Leaflet** with React-Leaflet for interactive maps
- **Recharts** for data visualization (charts, graphs)
- Support for offline map tiles and fiber route drawing

**State Management Strategy**
- Server state managed by TanStack Query with optimistic updates
- Local UI state managed by React hooks
- Authentication state via context (AuthProvider)
- Session-based authentication with server-side validation

### Backend Architecture

**Runtime & Framework**
- **Node.js** with **Express.js** for RESTful API
- **TypeScript** throughout for type safety
- **ESM modules** (type: "module" in package.json)

**Development vs Production**
- Development: Vite dev server with middleware mode for HMR
- Production: Pre-built static assets served by Express
- Separate entry points (index-dev.ts vs index-prod.ts)

**API Structure**
- RESTful endpoints under `/api` prefix
- Routes organized by resource (auth, jobs, clients, inventory, meter readings)
- Session-based authentication with secure cookie storage
- Request/response logging middleware for debugging

**Session Management**
- **express-session** with PostgreSQL store (connect-pg-simple)
- Secure session cookies with httpOnly and sameSite settings
- Session data persisted to database for scalability

### Data Storage

**Database**
- **PostgreSQL** via **Neon Serverless** (cloud-hosted, serverless Postgres)
- WebSocket connection protocol for serverless compatibility
- Connection pooling via `@neondatabase/serverless`

**ORM & Schema**
- **Drizzle ORM** for type-safe database queries
- Schema defined in `shared/schema.ts` for code sharing between client/server
- Snake case column mapping for PostgreSQL conventions
- Migration files stored in `/migrations` directory

**Database Schema**
Core tables include:
- `users` - Technician accounts with role-based access
- `clients` - Customer information with GPS coordinates
- `jobs` - Work orders with status tracking, materials, and photos
- `inventory_items` - Equipment and materials stock management
- `meter_readings` - Bluetooth device measurement data
- `inventory_usage` - Job-based material consumption tracking

**Data Validation**
- Zod schemas auto-generated from Drizzle schema using `drizzle-zod`
- Shared validation between client and server
- Insert/update schemas exclude auto-generated fields (id, timestamps)

### Authentication & Authorization

**Authentication Flow**
- Email/password login with bcrypt password hashing (10 rounds)
- Session-based auth (no JWT) with PostgreSQL session store
- Login endpoint creates session, stores user ID
- `/api/auth/me` endpoint validates session and returns current user
- Logout clears session data

**Authorization**
- Role field in users table: "Technician", "Team Leader", "Manager"
- Client-side route protection via AuthProvider context
- Server-side validation on protected endpoints
- Jobs filtered by technician ID for data isolation

**Security Measures**
- Passwords never sent in API responses
- bcrypt for one-way password hashing
- Session cookies with secure flags
- CORS and request validation

### External Dependencies

**Third-Party Services**
- **Neon Database** - Serverless PostgreSQL hosting with WebSocket support
- **OpenStreetMap / CartoDB** - Map tile provider for offline-capable mapping
- **Leaflet CDN** - Map visualization library assets

**Bluetooth Integration (Planned)**
- Web Bluetooth API for connecting to OTDR/power meters
- BLE device scanning and data parsing
- Meter readings stored in database with job association

**Image Handling**
- Client-side image compression before upload
- Multiple image attachments per job (before/after photos)
- Images stored as base64 or file references (implementation pending)

**Development Tools**
- **Replit-specific plugins**: Runtime error modal, cartographer, dev banner
- Custom Vite plugin for OpenGraph meta tag updates
- TypeScript path aliases: `@/*` for client, `@shared/*` for shared code

**Build & Deployment**
- Production build: Vite for client, esbuild for server bundle
- Single-file server output (`dist/index.js`)
- Static assets in `dist/public`
- Environment variable: `DATABASE_URL` for database connection
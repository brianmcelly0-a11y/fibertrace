# FiberTrace - Fiber Technician Management Application

## Overview

FiberTrace is a comprehensive web application designed for fiber optic technicians to manage jobs, track inventory, monitor equipment, and visualize fiber routes. Built with a modern tech stack, it provides both offline-first capabilities and real-time data synchronization for field technicians.

The application features a dark-themed UI with neon-blue accents, creating a technical aesthetic suitable for infrastructure management. It supports role-based access (Technician, Team Leader, Manager) and provides essential tools for day-to-day fiber optic installation and maintenance work.

## User Preferences

Preferred communication style: Simple, everyday language.

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
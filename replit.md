# FiberTrace - Fiber Technician Management Application

## Overview

FiberTrace is a comprehensive cross-platform application designed for fiber optic technicians to manage jobs, track inventory, monitor equipment, and visualize fiber routes. It provides both offline-first capabilities and real-time data synchronization for field technicians. The application features a dark-themed UI with neon-blue accents, supports role-based access (Technician, Team Leader, Manager), and offers essential tools for fiber optic installation and maintenance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- **Web App:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state management.
- **Mobile App:** React Native with Expo.
- **Offline-First (Mobile):** AsyncStorage-based persistence, intelligent sync manager, and an offline-first API adapter with fallback logic.

**UI Component System:**
- **shadcn/ui** components built on Radix UI primitives.
- **Tailwind CSS v4** for utility-first styling with a custom dark theme and neon-blue/purple accents.
- Custom fonts: Rajdhani for headers, Inter for body text, and Lucide icons.

**Form & Data Validation:**
- **React Hook Form** for state management, integrated with **Zod** for runtime schema validation.

**Mapping & Visualization:**
- **Leaflet** with React-Leaflet for interactive maps, supporting offline map tiles and fiber route drawing.
- **Recharts** for data visualization.

**State Management Strategy:**
- Server state managed by TanStack Query (with optimistic updates).
- Local UI state managed by React hooks.
- Authentication state via context (AuthProvider).
- Session-based authentication with server-side validation.

### Backend Architecture

**Runtime & Framework:**
- **Node.js** with **Express.js** for a RESTful API, written in TypeScript with ESM modules.

**API Structure:**
- RESTful endpoints under `/api`, organized by resource.
- Session-based authentication with secure cookie storage.

**Session Management:**
- **express-session** with a PostgreSQL store (`connect-pg-simple`).

### Data Storage

**Database:**
- **PostgreSQL** via **Neon Serverless** (cloud-hosted, serverless Postgres) with WebSocket connection protocol and connection pooling.

**ORM & Schema:**
- **Drizzle ORM** for type-safe queries.
- Schema defined in `shared/schema.ts` for client/server code sharing.
- Core tables: `users`, `clients`, `jobs`, `inventory_items`, `meter_readings`, `inventory_usage`.
- **Zod** schemas auto-generated from Drizzle for data validation.

### Authentication & Authorization

**Authentication Flow:**
- Email/password login with bcrypt hashing.
- Session-based auth with PostgreSQL session store.
- `/api/auth/me` endpoint for session validation.

**Authorization:**
- Role-based access control ("Technician", "Team Leader", "Manager").
- Client-side route protection and server-side endpoint validation.
- Jobs filtered by technician ID for data isolation.

**Security Measures:**
- bcrypt for password hashing, secure session cookies, CORS, and request validation.

### Features

- **Job Management:** Create, edit, track jobs (Pending, In Progress, Completed), multi-node route creation, automatic cable and time estimation, power impact analysis, inline note editing.
- **Offline Capabilities:** Complete offline functionality for mobile, automatic synchronization when online, transparent online/offline switching, and queued unsynced jobs.
- **Map & GPS:** Interactive map with fiber node types (OLT, Splitter, FAT, ATB, Closure), multi-select nodes, GPS tracking with route recording and distance calculations, route optimization.
- **Inventory & Metering:** Inventory item management, meter reading data storage (planned Bluetooth integration).
- **Search & Filter:** Real-time search and filtering by node type, power level, and other criteria.
- **Bulk Operations:** Multi-select, export (JSON/CSV), import (JSON/CSV), and bulk delete of nodes.
- **Power Analysis:** Dashboard with average, min/max power, distribution histogram, and critical node identification.
- **Mobile Responsiveness:** Adaptive UI with flexible layouts and touch-friendly controls.

## External Dependencies

- **Neon Database:** Serverless PostgreSQL hosting.
- **OpenStreetMap / CartoDB:** Map tile provider.
- **Leaflet CDN:** Map visualization library assets.
- **Web Bluetooth API (Planned):** For connecting to OTDR/power meters.
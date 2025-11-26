# FiberTrace Mobile App

React Native mobile application for FiberTrace - Fiber Technician Management System.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd mobile
npm install
```

### Setup Environment

Create `.env` file:
```
EXPO_PUBLIC_API_URL=http://your-backend-url:5000
```

Or leave it as default (localhost:5000 for development).

### Running the App

**Start development server:**
```bash
npm start
```

**Run on Android:**
```bash
npm run android
```

**Run on iOS:**
```bash
npm run ios
```

**Run on Web:**
```bash
npm run web
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/         # App screens (Map, Jobs)
│   ├── lib/             # Utilities and API client
│   ├── theme/           # Colors and styling
│   └── App.tsx          # Main app component
├── assets/              # Icons and images
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Features

- **Interactive Map** - View fiber nodes (OLT, Splitter, FAT, ATB, Closure)
- **GPS Tracking** - Track technician location and route
- **Job Management** - View and create jobs
- **Dark Theme** - Neon blue UI matching web design

## Backend Connection

This app connects to the same Express backend API at `/api/*` endpoints:
- `GET /api/olts` - Fetch OLT nodes
- `GET /api/splitters` - Fetch Splitter nodes
- `GET /api/fats` - Fetch FAT nodes
- `GET /api/atbs` - Fetch ATB nodes
- `GET /api/closures` - Fetch Closure nodes
- `GET /api/jobs` - Fetch jobs
- `POST /api/jobs` - Create job

## Building for Production

```bash
npm run build
```

This generates APK (Android) and IPA (iOS) files.

## Permissions Required

- Location access (GPS tracking)
- Camera (for photos - future feature)

## Tech Stack

- React Native with Expo
- React Navigation (Bottom tabs)
- TanStack Query (Data fetching)
- React Native Maps
- TypeScript
- Zod (Validation)

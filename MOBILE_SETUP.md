# FiberTrace Mobile App - Quick Start Guide

## What's Been Created

A **React Native mobile app** (iOS & Android) that mirrors the web app with the same design, colors, and functionality:

- ✅ Map screen with fiber nodes (OLT, Splitter, FAT, ATB, Closure)
- ✅ Jobs management screen
- ✅ GPS tracking integration
- ✅ Dark theme with neon-blue accents (matching web design)
- ✅ Bottom tab navigation (Map / Jobs)
- ✅ Connected to same Express backend API

## Project Structure

```
mobile/
├── src/
│   ├── screens/         # Map & Jobs screens
│   ├── lib/             # API client & utilities
│   ├── theme/           # Color system
│   └── App.tsx          # Main navigation
├── app.json             # Expo config
├── package.json         # Dependencies
└── README.md            # Full documentation
```

## Getting Started (3 Steps)

### Step 1: Install Dependencies
```bash
cd mobile
npm install --legacy-peer-deps
```

### Step 2: Create .env File
```bash
cp .env.example .env
# Edit .env if needed (default localhost:5000 works)
```

### Step 3: Start Development
```bash
# Start development server
npm start

# Or run on specific platform:
npm run android      # Android emulator
npm run ios          # iOS simulator
npm run web          # Web browser
```

## Features Included

### Map Screen
- Interactive map with all node types
- Click nodes to view details
- GPS tracking with route visualization
- Start/Stop GPS button
- Real-time location display

### Jobs Screen
- List all jobs from backend
- Job details (type, address, status)
- Status badges (Pending, In Progress, Completed)
- Empty state message

### Theme
- Dark background matching web design
- Neon cyan primary color
- Electric purple accents
- Professional card-based UI

## Backend Connection

The mobile app connects to the same Express backend:
- Reads OLTs, Splitters, FATs, ATBs, Closures from `/api/*`
- Fetches jobs from `/api/jobs`
- Creates jobs via `POST /api/jobs`
- Saves routes via `/api/fiber-routes`

**Make sure the backend is running** before starting the mobile app.

## Next Steps to Complete Mobile App

### Phase 1: Core Features (Already Done ✅)
- ✅ Map screen with nodes
- ✅ Jobs management
- ✅ GPS tracking
- ✅ Theme & styling
- ✅ Navigation structure

### Phase 2: Enhanced Features (To Do)
- Job creation form
- Route drawing on map
- Power analysis dashboard
- Node search & filter
- Offline map caching

### Phase 3: Advanced Features (Future)
- Bluetooth device integration
- Camera for photos
- Advance job workflows
- Real-time updates (WebSocket)
- Team collaboration

## Troubleshooting

### Dependencies Won't Install
```bash
npm install --legacy-peer-deps
```

### Map not showing on device
- Check API_URL in .env matches your backend
- Ensure backend is running on the configured port
- Check network permissions on device

### GPS not working
- Grant location permission when prompted
- Enable location services on device
- Check device has GPS capability

### React Native compatibility issues
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
npm start -- --clear
```

## Building for Production

### Android APK
```bash
npm run build:android
# APK will be available for download
```

### iOS App
```bash
npm run build:ios
# IPA will be available for download
```

## Important Notes

1. **Same Backend**: Uses same `/server` Express API as web app
2. **Environment Variable**: Set `EXPO_PUBLIC_API_URL` in `.env` if not localhost
3. **Permissions**: App requests location access for GPS tracking
4. **Dark Mode**: Always in dark mode - matches web app design

## File Structure Quick Reference

```
mobile/src/
├── App.tsx                      # Main app entry, navigation setup
├── screens/
│   ├── MapScreen.tsx           # Interactive map with nodes
│   └── JobsScreen.tsx          # Jobs list view
├── lib/
│   ├── api.ts                  # Backend API client
│   └── utils.ts                # Helper functions
└── theme/
    └── colors.ts               # Dark theme colors
```

## Available Commands

```bash
npm start              # Start dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in web browser
npm run build          # Build for iOS & Android
npm install --legacy-peer-deps  # Install dependencies
```

## Questions?

Check the README.md in this directory for more detailed documentation.

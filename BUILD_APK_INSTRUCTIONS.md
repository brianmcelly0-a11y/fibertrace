# FiberTrace Mobile - APK Build Instructions

## Quick Start (One-time setup)

### 1. Login to Expo Account
```bash
cd /home/runner/workspace
eas login
# Enter your Expo credentials when prompted
```

### 2. Build APK
```bash
eas build --platform android --local
# or for cloud build:
eas build --platform android
```

### 3. Download APK
- **Local build**: APK will be in the current directory
- **Cloud build**: Download from https://expo.dev after build completes

## Configuration
- **Package**: com.fibertrace.app
- **Version**: 1.0.0
- **Min SDK**: Configured in app.json
- **Build Type**: APK (signed release build)

## Features Included
- ✅ 5 Hub Navigation (Tools, Infrastructure, Jobs, Reports, Settings)
- ✅ Real Backend Integration (PostgreSQL)
- ✅ Offline-First Architecture
- ✅ AsyncStorage Persistence
- ✅ GPS & Bluetooth Support
- ✅ Material Design UI

## Install on Device
```bash
adb install -r fibertrace-<version>.apk
# or transfer APK file to Android device and tap to install
```

## Troubleshooting
- If build fails, try: `eas build --platform android --clean`
- Check Expo logs: `eas build:list`
- Verify app.json is valid: `cat app.json | jq .`

## Test Credentials
- Email: admin@fibertrace.app
- Password: admin123456

---
Created for FiberTrace Mobile v1.0.0

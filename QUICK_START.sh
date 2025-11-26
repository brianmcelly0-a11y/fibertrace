#!/bin/bash

echo "🚀 FiberTrace Quick Start APK Build"
echo "===================================="
echo ""
echo "Choose your build method:"
echo ""
echo "1) Cloud Build (Recommended - EAS)"
echo "2) Local Build"
echo "3) View Instructions"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "Cloud Build via EAS:"
    echo "1. npm install -g eas-cli"
    echo "2. eas login (create free Expo account)"
    echo "3. eas build --platform android --build-type apk"
    echo ""
    echo "Done! Download APK from https://expo.dev/builds"
    ;;
  2)
    echo ""
    echo "Local Build:"
    echo "1. npm install"
    echo "2. npx expo prebuild --platform android --clean"
    echo "3. cd android && ./gradlew assembleRelease"
    echo ""
    echo "Find APK: android/app/build/outputs/apk/release/"
    ;;
  3)
    echo ""
    cat APK_BUILD_GUIDE.md
    ;;
  *)
    echo "Invalid choice"
    ;;
esac

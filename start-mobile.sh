#!/bin/bash
cd /home/runner/workspace
export CI=true
exec npx expo start --web --port 5000

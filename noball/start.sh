#!/bin/bash
# noBall — Quick Start
# Run this on your own machine (Mac/Linux/WSL) to start the app.
# Then open the printed URL on your phone.

set -e

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   noBall — Do You Know Ball?          ║"
echo "  ║   NCAA DI Wrestling Predictions       ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Node.js is required. Install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Node.js 18+ required. You have $(node -v)"
  exit 1
fi

echo "[1/4] Installing dependencies..."
npm install --silent 2>/dev/null
cd client && npm install --silent 2>/dev/null && cd ..

echo "[2/4] Building frontend..."
cd client && npx vite build --silent 2>/dev/null && cd ..

echo "[3/4] Seeding database..."
cd server && node seed.js && cd ..

echo "[4/4] Starting server..."
echo ""

# Get local IP
if command -v hostname &> /dev/null; then
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
fi

PORT=${PORT:-3001}

echo "  ┌─────────────────────────────────────────┐"
echo "  │  noBall is running!                      │"
echo "  │                                          │"
echo "  │  Local:   http://localhost:$PORT          │"
echo "  │  Phone:   http://$LOCAL_IP:$PORT    │"
echo "  │                                          │"
echo "  │  Open the Phone URL on your phone        │"
echo "  │  (same WiFi network)                     │"
echo "  └─────────────────────────────────────────┘"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

cd server && exec node index.js

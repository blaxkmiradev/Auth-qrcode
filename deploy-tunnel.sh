#!/bin/bash

# Cloudflare Tunnel Deployment Script for TOTP Auth
# Run this to start your app with Cloudflare Tunnel

APP_DIR="/data/.openclaw/workspace/totp-auth"
TUNNEL_NAME="totp-auth-tunnel"
PORT=3000

echo "🚀 Starting TOTP Auth with Cloudflare Tunnel..."

# Kill any existing node processes on this port
pkill -f "node app.js" 2>/dev/null || true

# Start the Express app in background
cd "$APP_DIR"
npm start &
APP_PID=$!
echo "✅ App started on port $PORT (PID: $APP_PID)"

# Wait for app to be ready
sleep 3

# Start Cloudflare Tunnel
echo "🌐 Starting Cloudflare Tunnel..."
cloudflared tunnel --url http://localhost:$PORT &
TUNNEL_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Your app is now live!"
echo "📱 Check the terminal for your Cloudflare URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To stop: kill $APP_PID $TUNNEL_PID"
echo ""

# Keep script running
wait
